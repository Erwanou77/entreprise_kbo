const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017"; 
const dbName = "tp_KBO";

// Paths to CSV files
const paths = {
    enterprise: './enterprise.csv',
    branch: './branch.csv',
    establishment: './establishment.csv',
    activity: './activity.csv',
    address: './address.csv',
    contact: './contact.csv',
    denomination: './denomination.csv',
    code: './code.csv'
};

// Limit the number of enterprises to process per batch
const batchSize = 500000;

// Helper to load CSV data
async function loadCSV(path, entityNumbers = new Set(), keyColumn = 'EntityNumber') {
    console.log(`Chargement des données CSV depuis ${path}...`);
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(path)
            .pipe(csv())
            .on('data', (data) => {
                if (!entityNumbers.size || entityNumbers.has(data[keyColumn])) {
                    results.push(data);
                }
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Helper to process codes and get description based on category, code, and language (French)
function getCodeDescription(codeData, category, code) {
    const result = codeData.find(item => item.Category === category && item.Code === code && item.Language === 'FR');
    return result ? result.Description : null;
}

// Helper function to check if a value is empty or contains only spaces
function sanitizeValue(value) {
    return value && value.trim() !== '' ? value : null;
}

// Convert array to Map for faster lookups by `entity_number`
function convertToMap(entities) {
    return new Map(entities.map(entity => [entity.entity_number, entity]));
}

// Main function to load, process, and send the JSON data to MongoDB in batches
async function processData() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('enterprises3');
        console.log("Connecté à MongoDB.");

        // Load the code data which will be used in all batches
        const [codeData] = await Promise.all([loadCSV(paths.code)]);

        // Load primary data (enterprise) in batches
        console.log("Chargement et traitement des données par batch...");
        let batchIndex = 0;
        while (true) {
            const enterpriseData = await loadCSV(paths.enterprise).then(data => data.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize));

            if (enterpriseData.length === 0) {
                break;  // Sort si plus aucune entreprise n'est à traiter
            }

            console.log(`Traitement du batch n° ${batchIndex + 1} contenant ${enterpriseData.length} entreprises.`);

            const allEntityNumbers = new Set(enterpriseData.map(item => item.EnterpriseNumber));

            let [branchData, establishmentData] = await Promise.all([
                loadCSV(paths.branch, allEntityNumbers, 'EnterpriseNumber'),
                loadCSV(paths.establishment, allEntityNumbers, 'EnterpriseNumber')
            ]);
            
            branchData.forEach(item => allEntityNumbers.add(item.Id));
            establishmentData.forEach(item => allEntityNumbers.add(item.EstablishmentNumber));

            let [activityData, addressData, contactData, denominationData] = await Promise.all([
                loadCSV(paths.activity, allEntityNumbers),
                loadCSV(paths.address, allEntityNumbers),
                loadCSV(paths.contact, allEntityNumbers),
                loadCSV(paths.denomination, allEntityNumbers)
            ]);
            
            console.log("Création des entités...");
            const entities = enterpriseData.map(row => createEntity(row, codeData));
            const entityMap = convertToMap(entities);

            console.log(`Créé ${entities.length} entités pour le batch ${batchIndex + 1}.`);

            const establishments = processEstablishmentData(establishmentData);
            establishmentData.length = 0;
            const branches = processBranchData(branchData);
            branchData.length = 0;

            const establishmentMap = establishments;
            const branchMap = branches;

            await Promise.all([
                processActivityData(activityData, entityMap, establishmentMap, branchMap, codeData),  
                processAddressData(addressData, entityMap, establishmentMap, branchMap, codeData),
                processContactData(contactData, entityMap, establishmentMap, branchMap),
                processDenominationData(denominationData, entityMap, establishmentMap, branchMap, codeData)
            ]);

            addEstablishmentsToEnterprises(entityMap, establishments);
            addBranchesToEnterprises(entityMap, branches); 

            console.log(`Insertion des données du batch n° ${batchIndex + 1} dans MongoDB...`);
            await collection.insertMany(Array.from(entityMap.values()));
            console.log(`Données du batch n° ${batchIndex + 1} insérées avec succès.`);

            entityMap.clear();

            enterpriseData.length = 0;
            branchData.length = 0;
            establishmentData.length = 0;
            activityData.length = 0;
            addressData.length = 0;
            contactData.length = 0;
            denominationData.length = 0;

            batchIndex++;
        }

        console.log("Traitement terminé pour tous les batches.");

    } catch (err) {
        console.error("Erreur lors du traitement des données : ", err);
    } finally {
        await client.close();
        console.log("Connexion MongoDB fermée.");
    }
}

// Create a new entity object for enterprise
function createEntity(row, codeData) {
    return {
        entity_number: sanitizeValue(row.EnterpriseNumber),
        entity_type: 'enterprise',
        status: sanitizeValue(getCodeDescription(codeData, "Status", row.Status)),
        juridical_situation: sanitizeValue(getCodeDescription(codeData, "JuridicalSituation", row.JuridicalSituation)),
        type_of_enterprise: sanitizeValue(getCodeDescription(codeData, "TypeOfEnterprise", row.TypeOfEnterprise)),
        juridical_form: sanitizeValue(getCodeDescription(codeData, "JuridicalForm", row.JuridicalForm)),
        juridical_form_cac: sanitizeValue(row.JuridicalFormCAC),
        start_date: sanitizeValue(row.StartDate),
        activities: [],
        contacts: {},  // Contacts stored as an object
        addresses: {},  // Addresses stored by type
        denominations: {},  // Denominations stored by type_of_denomination
        branches: {}, 
        establishments: {}
    };
}

// Process contact data for enterprises, establishments, and branches using contact_type as key
async function processContactData(contactData, entityMap, establishmentMap, branchMap) {
    console.log("Traitement des données de contact...");

    contactData.forEach(row => {
        const contact = {
            value: sanitizeValue(row.Value)
        };

        const contactType = sanitizeValue(row.ContactType);

        // Fonction pour ajouter un contact à une entité donnée (entreprise, établissement, ou succursale)
        function addContactToEntity(entity) {
            if (!entity.contacts) {
                entity.contacts = {};  // Initialise les contacts s'il n'existe pas
            }
            entity.contacts[contactType] = contact;  // Utiliser contact_type comme clé
        }

        // Récupération de l'entité correspondante et ajout du contact
        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            addContactToEntity(enterprise);
        } else if (establishmentMap[row.EntityNumber]) {
            addContactToEntity(establishmentMap[row.EntityNumber]);
        } else if (branchMap[row.EntityNumber]) {
            addContactToEntity(branchMap[row.EntityNumber]);
        } else {
            console.warn(`Aucune entreprise, établissement ou succursale trouvée pour l'EntityNumber ${row.EntityNumber}`);
        }
    });

    console.log("Traitement des données de contact terminé.");
    contactData = null; // Libération de la mémoire après traitement
}

// Process activity data for enterprises, establishments, and branches
async function processActivityData(activityData, entityMap, establishmentMap, branchMap, codeData) {
    console.log("Début du traitement des données d'activité...");
    activityData.forEach(row => {
        const activity = {
            nace: sanitizeValue('Nace' + row.NaceVersion),
            activity_group: sanitizeValue(getCodeDescription(codeData, "ActivityGroup", row.ActivityGroup)),
            nace_code: row.NaceCode,
            nace_description: sanitizeValue(getCodeDescription(codeData, 'Nace' + row.NaceVersion, row.NaceCode)),
            classification: sanitizeValue(getCodeDescription(codeData, "Classification", row.Classification))
        };

        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            enterprise.activities.push(activity);
        } else if (establishmentMap[row.EntityNumber]) {
            establishmentMap[row.EntityNumber].activities.push(activity);
        } else if (branchMap[row.EntityNumber]) {
            branchMap[row.EntityNumber].activities.push(activity);
        } else {
            console.warn(`Aucune entreprise, établissement ou succursale trouvée pour l'EntityNumber ${row.EntityNumber}`);
        }
    });
    console.log("Traitement des données d'activité terminé.");
    activityData = null;
}

// Process address data for enterprises, establishments, and branches using type_of_address as key
async function processAddressData(addressData, entityMap, establishmentMap, branchMap, codeData) {
    console.log("Traitement des données d'adresse...");

    addressData.forEach(row => {
        const address = {
            zipcode: sanitizeValue(row.Zipcode),
            municipality: sanitizeValue(row.MunicipalityFR),
            street: sanitizeValue(row.StreetFR),
            house_number: sanitizeValue(row.HouseNumber),
            box: sanitizeValue(row.Box),
            extra_address_info: sanitizeValue(row.ExtraAddressInfo)
        };

        const typeOfAddress = sanitizeValue(getCodeDescription(codeData, "TypeOfAddress", row.TypeOfAddress)) || sanitizeValue(row.TypeOfAddress);

        // Fonction pour ajouter une adresse à une entité donnée (entreprise, établissement, ou succursale)
        function addAddressToEntity(entity) {
            if (!entity.addresses) {
                entity.addresses = {};  // Initialise les addresses si elles n'existent pas
            }
            entity.addresses[typeOfAddress] = address;  // Utilise type_of_address comme clé
        }

        // Récupération de l'entité correspondante et ajout de l'adresse
        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            addAddressToEntity(enterprise);
        } else if (establishmentMap[row.EntityNumber]) {
            addAddressToEntity(establishmentMap[row.EntityNumber]);
        } else if (branchMap[row.EntityNumber]) {
            addAddressToEntity(branchMap[row.EntityNumber]);
        } else {
            console.warn(`Aucune entreprise, établissement ou succursale trouvée pour l'EntityNumber ${row.EntityNumber}`);
        }
    });

    console.log("Traitement des données d'adresse terminé.");
    addressData = null;
}

// Process denomination data for enterprises, establishments, and branches using type_of_denomination as key
async function processDenominationData(denominationData, entityMap, establishmentMap, branchMap, codeData) {
    console.log("Traitement des données de dénomination...");

    denominationData.forEach(row => {
        const denomination = sanitizeValue(row.Denomination);
        const typeOfDenomination = sanitizeValue(getCodeDescription(codeData, "TypeOfDenomination", row.TypeOfDenomination)) || sanitizeValue(row.TypeOfDenomination);

        function addDenominationToEntity(entity) {
            if (!entity.denominations) {
                entity.denominations = {};
            }
            entity.denominations[typeOfDenomination] = denomination;  // Utiliser type_of_denomination comme clé
        }

        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            addDenominationToEntity(enterprise);
        } else if (establishmentMap[row.EntityNumber]) {
            addDenominationToEntity(establishmentMap[row.EntityNumber]);
        } else if (branchMap[row.EntityNumber]) {
            addDenominationToEntity(branchMap[row.EntityNumber]);
        } else {
            console.warn(`Aucune entreprise, établissement ou succursale trouvée pour l'EntityNumber ${row.EntityNumber}`);
        }
    });

    console.log("Traitement des données de dénomination terminé.");
    denominationData = null; // Libération de la mémoire après traitement
}

// Process establishment data and return it as an object keyed by EstablishmentNumber
function processEstablishmentData(establishmentData) {
    console.log("Traitement des données d'établissement...");

    const establishments = {};
    establishmentData.forEach(row => {
        establishments[row.EstablishmentNumber] = {
            entity_number: row.EnterpriseNumber,
            start_date: row.StartDate,
            activities: [],
            addresses: {},
            contacts: {},
            denominations: {}
        };
    });

    console.log("Traitement des données d'établissement terminé.");
    return establishments;
}

// Process branch data and return it as an object keyed by BranchId
function processBranchData(branchData) {
    console.log("Traitement des données de succursale...");

    const branches = {};
    branchData.forEach(row => {
        branches[row.Id] = {
            entity_number: row.EnterpriseNumber,
            start_date: row.StartDate,
            activities: [],
            addresses: {},
            contacts: {},
            denominations: {}
        };
    });

    console.log("Traitement des données de succursale terminé.");
    return branches;
}

// Add establishments into their respective enterprises
function addEstablishmentsToEnterprises(entityMap, establishments) {
    console.log("Ajout des établissements aux entreprises...");

    for (const establishmentNumber in establishments) {
        if (Object.hasOwnProperty.call(establishments, establishmentNumber)) {
            const establishment = establishments[establishmentNumber];
            const enterprise = entityMap.get(establishment.entity_number);
            if (enterprise) {
                delete establishment.establishment_number;
                enterprise.establishments[establishmentNumber] = establishment;
            } else {
                console.warn(`Entreprise ${establishment.entity_number} non trouvée pour l'établissement ${establishmentNumber}`);
            }
        }
    }
    console.log("Ajout des établissements terminé.");
}

// Add branches into their respective enterprises
function addBranchesToEnterprises(entityMap, branches) {
    console.log("Ajout des succursales aux entreprises...");

    for (const branchId in branches) {
        if (Object.hasOwnProperty.call(branches, branchId)) {
            const branch = branches[branchId];
            const enterprise = entityMap.get(branch.entity_number);
            if (enterprise) {
                delete branch.branch_id;
                enterprise.branches[branchId] = branch;
            } else {
                console.warn(`Entreprise ${branch.entity_number} non trouvée pour la succursale ${branchId}`);
            }
        }
    }
    console.log("Ajout des succursales terminé.");
}

// Start the data processing
processData();

