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
        const collection = db.collection('enterprises');
        console.log("Connecté à MongoDB.");

        // Load the code data which will be used in all batches
        const [codeData] = await Promise.all([loadCSV(paths.code)]);

        // Load primary data (enterprise) in batches
        console.log("Chargement et traitement des données par batch...");
        let batchIndex = 0;
        while (true) {
            // Charge et traite un batch d'entreprises
            const enterpriseData = await loadCSV(paths.enterprise).then(data => data.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize));

            if (enterpriseData.length === 0) {
                break;  // Sort si plus aucune entreprise n'est à traiter
            }

            console.log(`Traitement du batch n° ${batchIndex + 1} contenant ${enterpriseData.length} entreprises.`);

            // Collecte tous les EntityNumbers pertinents pour le batch en cours
            const allEntityNumbers = new Set(enterpriseData.map(item => item.EnterpriseNumber));

            let [branchData, establishmentData] = await Promise.all([
                loadCSV(paths.branch, allEntityNumbers, 'EnterpriseNumber'),
                loadCSV(paths.establishment, allEntityNumbers, 'EnterpriseNumber')
            ]);
            
            branchData.forEach(item => allEntityNumbers.add(item.Id));
            establishmentData.forEach(item => allEntityNumbers.add(item.EstablishmentNumber));

            // Charge et filtre les fichiers CSV secondaires en fonction des EntityNumbers pertinents
            let [activityData, addressData, contactData, denominationData] = await Promise.all([
                loadCSV(paths.activity, allEntityNumbers),
                loadCSV(paths.address, allEntityNumbers),
                loadCSV(paths.contact, allEntityNumbers),
                loadCSV(paths.denomination, allEntityNumbers)
            ]);
            
            console.log("Création des entités...");
            // Crée un tableau d'entités pour le batch en cours
            const entities = enterpriseData.map(row => createEntity(row, codeData));
            const entityMap = convertToMap(entities);

            console.log(`Créé ${entities.length} entités pour le batch ${batchIndex + 1}.`);

            // Traitement des données d'établissement et de succursale
            const establishments = processEstablishmentData(establishmentData);
            const branches = processBranchData(branchData);

            // Utilise des maps pour accélérer la recherche d'établissements et de succursales
            const establishmentMap = new Map(establishments.map(est => [est.establishment_number, est]));
            const branchMap = new Map(branches.map(branch => [branch.branch_id, branch]));

            // Traitement des activités, adresses, contacts et dénominations pour les entreprises, établissements et succursales
            await Promise.all([
                processActivityData(activityData, entityMap, establishmentMap, branchMap, codeData),  
                processAddressData(addressData, entityMap, establishmentMap, branchMap, codeData),
                processContactData(contactData, entityMap, establishmentMap, branchMap),
                processDenominationData(denominationData, entityMap, establishmentMap, branchMap, codeData)
            ]);

            // Ajout des établissements et des succursales aux entreprises correspondantes
            addEstablishmentsToEnterprises(entityMap, establishments);
            addBranchesToEnterprises(entityMap, branches);

            // Insertion des données traitées dans MongoDB
            console.log(`Insertion des données du batch n° ${batchIndex + 1} dans MongoDB...`);
            await collection.insertMany(Array.from(entityMap.values()));
            console.log(`Données du batch n° ${batchIndex + 1} insérées avec succès.`);

            // Clear les données non utilisées pour éviter une surcharge mémoire
            entityMap.clear();
            establishmentMap.clear();
            branchMap.clear();

            // Remettre les tableaux à null après utilisation
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
        contacts: [],
        addresses: [],
        denominations: [],
        branches: [], 
        establishments: [] 
    };
}

// Process branch and establishment data and return them as maps
function processEstablishmentData(establishmentData) {
    console.log("Traitement des données d'établissement...");

    const establishments = establishmentData.map(row => ({
        establishment_number: row.EstablishmentNumber,
        entity_number: row.EnterpriseNumber,
        start_date: row.StartDate,
        activities: [],
        addresses: [],
        contacts: [],
        denominations: []
    }));

    console.log("Traitement des données d'établissement terminé.");
    return establishments;
}

// Process branch data and return branches separately
function processBranchData(branchData) {
    console.log("Traitement des données de succursale...");

    const branches = branchData.map(row => ({
        branch_id: row.Id,
        entity_number: row.EnterpriseNumber,
        start_date: row.StartDate,
        addresses: [],
        denominations: [],
    }));

    console.log("Traitement des données de succursale terminé.");
    return branches;
}

// Process activity data for enterprises, establishments, and branches
async function processActivityData(activityData, entityMap, establishmentMap, branchMap, codeData) {
    console.log("Début du traitement des données d'activité...");
    activityData.forEach(row => {
        const activity = {
            nace: sanitizeValue('Nace' + row.NaceVersion),
            activity_group: sanitizeValue(getCodeDescription(codeData, "ActivityGroup", row.ActivityGroup)),
            nace_description: sanitizeValue(getCodeDescription(codeData, 'Nace' + row.NaceVersion, row.NaceCode)),
            classification: sanitizeValue(getCodeDescription(codeData, "Classification", row.Classification))
        };

        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            enterprise.activities.push(activity);
            // console.log(`Activité ajoutée à l'entreprise ${row.EntityNumber}`);
        } else {
            const establishment = establishmentMap.get(row.EntityNumber);
            if (establishment) {
                establishment.activities.push(activity);
                // console.log(`Activité ajoutée à l'établissement ${row.EntityNumber}`);
            } else {
                const branch = branchMap.get(row.EntityNumber);
                if (branch) {
                    branch.activities.push(activity);
                    // console.log(`Activité ajoutée à la succursale ${row.EntityNumber}`);
                } else {
                    console.warn(`Aucune entreprise, établissement ou succursale trouvée pour l'EntityNumber ${row.EntityNumber}`);
                }
            }
        }
    });
    console.log("Traitement des données d'activité terminé.");
    activityData = null;
}


// Process address data for enterprises, establishments, and branches
async function processAddressData(addressData, entityMap, establishmentMap, branchMap, codeData) {
    console.log("Traitement des données d'adresse...");

    addressData.forEach(row => {
        const address = {
            type_of_address: sanitizeValue(getCodeDescription(codeData, "TypeOfAddress", row.TypeOfAddress)) || sanitizeValue(row.TypeOfAddress),
            zipcode: sanitizeValue(row.Zipcode),
            municipality: sanitizeValue(row.MunicipalityFR),
            street: sanitizeValue(row.StreetFR),
            house_number: sanitizeValue(row.HouseNumber),
            box: sanitizeValue(row.Box),
            extra_address_info: sanitizeValue(row.ExtraAddressInfo)
        };

        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            // Add address to the enterprise
            enterprise.addresses.push(address);
        } else {
            const establishment = establishmentMap.get(row.EntityNumber);
            if (establishment) {
                establishment.addresses.push(address);
            } else {
                const branch = branchMap.get(row.EntityNumber);
                if (branch) {
                    branch.addresses.push(address);
                }
            }
        }
    });

    console.log("Traitement des données d'adresse terminé.");
    addressData = null;
}


// Process contact data for enterprises, establishments, and branches
async function processContactData(contactData, entityMap, establishmentMap, branchMap) {
    console.log("Traitement des données de contact...");
    contactData.forEach(row => {
        const contact = {
            contact_type: sanitizeValue(row.ContactType),
            value: sanitizeValue(row.Value)
        };
        // console.log(row.EntityNumber);
        
        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            enterprise.contacts.push(contact);
        } else {
            const establishment = establishmentMap.get(row.EntityNumber);
            if (establishment) {
                establishment.contacts.push(contact);
                // console.log(establishment);
            } else {
                const branch = branchMap.get(row.EntityNumber);
                if (branch) {
                    branch.contacts.push(contact);
                }
            }
        }
    });
    console.log("Traitement des données de contact terminé.");
    contactData = null;
}

// Process denomination data for enterprises, establishments, and branches
async function processDenominationData(denominationData, entityMap, establishmentMap, branchMap, codeData) {
    console.log("Traitement des données de dénomination...");
    denominationData.forEach(row => {
        const denomination = {
            type_of_denomination: sanitizeValue(getCodeDescription(codeData, "TypeOfDenomination", row.TypeOfDenomination)),
            denomination: sanitizeValue(row.Denomination)
        };

        const enterprise = entityMap.get(row.EntityNumber);
        if (enterprise) {
            enterprise.denominations.push(denomination);
        } else {
            const establishment = establishmentMap.get(row.EntityNumber);
            if (establishment) {
                establishment.denominations.push(denomination);
            } else {
                const branch = branchMap.get(row.EntityNumber);
                if (branch) {
                    branch.denominations.push(denomination);
                } else {
                    // Avertir si aucune entreprise, établissement ou succursale n'est trouvée
                    console.warn(`Aucune entreprise, établissement ou succursale trouvée pour l'EntityNumber ${row.EntityNumber}. Impossible d'ajouter la dénomination.`);
                }
            }
        }
    });
    console.log("Traitement des données de dénomination terminé.");
    denominationData = null;
}


// Add establishments into their respective enterprises
function addEstablishmentsToEnterprises(entityMap, establishments) {
    console.log("Ajout des établissements aux entreprises...");
    establishments.forEach(establishment => {
        const enterprise = entityMap.get(establishment.entity_number);
        if (enterprise) {
            // Supprimer la propriété establishment_number
            delete establishment.establishment_number;
    
            // Ajouter l'établissement à l'entreprise
            enterprise.establishments.push(establishment);
        } else {
            console.warn(`Entreprise ${establishment.entity_number} non trouvée pour l'établissement ${establishment.establishment_number}`);
        }
    });
    
    console.log("Ajout des établissements terminé.");
}

// Add branches into their respective enterprises
function addBranchesToEnterprises(entityMap, branches) {
    console.log("Ajout des succursales aux entreprises...");
    branches.forEach(branch => {
        const enterprise = entityMap.get(branch.entity_number);
        if (enterprise) {
            // Supprimer la propriété establishment_number
            delete branch.entity_number;
            enterprise.branches.push(branch);
        } else {
            console.warn(`Entreprise ${branch.entity_number} non trouvée pour la succursale ${branch.branch_id}`);
        }
    });
    console.log("Ajout des succursales terminé.");
}


// Start the data processing
processData();
