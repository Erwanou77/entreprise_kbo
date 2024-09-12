const axios = require('axios');
const cheerio = require('cheerio');

// Fonction principale pour scraper les données d'une société
const scrapeCompanyData = async (companyId) => {
    try {
        const kboResponse = await axios.get(
            `https://kbopub.economie.fgov.be/kbopub/toonvestigingps.html?lang=fr&ondernemingsnummer=${companyId}`
        );

        if (!kboResponse || !kboResponse.data) {
            console.error(`Aucune donnée trouvée pour l'ID: ${companyId}`);
            return null;
        }

        const $ = cheerio.load(kboResponse.data);
        const generalInfo = extractKboData($);

        // Structure des résultats avec les infos générales
        let companyData = {
            [generalInfo.enterpriseNumber]: {
                name: generalInfo.name,
                status: generalInfo.status,
                address: generalInfo.address,
                startDate: generalInfo.startDate
            }
        };
        

        const directorResponse = await axios.get(
            `https://kbopub.economie.fgov.be/kbopub/toonondernemingps.html?lang=fr&ondernemingsnummer=${companyId}`
        );

        if (directorResponse && directorResponse.data) {
            const singleData = cheerio.load(directorResponse.data);
            const directorInfo = extractKboData(singleData);

            // Ajouter les données du gérant et du site web
            companyData[generalInfo.enterpriseNumber] = {
                ...companyData[generalInfo.enterpriseNumber],
                director: directorInfo.gerant,
                website: directorInfo.website,
            };
        }

        const companywebResponse = await axios.get(`https://www.companyweb.be/fr/${companyId}`);
        if (companywebResponse && companywebResponse.data) {
            const companywebHtml = cheerio.load(companywebResponse.data);
            const financialInfo = extractCompanyWebData(companywebHtml);

            // Ajout des informations financières
            companyData[generalInfo.enterpriseNumber] = {
                ...companyData[generalInfo.enterpriseNumber],
                capital: financialInfo.capital,
                juridical: financialInfo.juridical
            };
        }

        return companyData;
    } catch (error) {
        console.error(`Erreur lors du scraping pour l'ID ${companyId}:`, error);
        return null;
    }
};

// Extraction des données depuis la page KBO
function extractKboData($) {
    return {
        enterpriseNumber: $('td:contains("Numéro d\'entreprise:")').next().text()?.trim(),
        startDate: $('td:contains("Date de début:")').next().text()?.trim(),
        name: $('td:contains("Dénomination")').next().text()?.trim()?.split('Dénomination')[0],
        email: $('td:contains("E-mail:")').next().text()?.trim(),
        gerant: $('td:contains("Gérant:")').next().text()?.trim(),
        website: $('td:contains("Adresse web:")').next().text()?.trim()
    };
}

// Extraction des informations depuis CompanyWeb
function extractCompanyWebData($) {
    const years = [];
    const capitals = [];
    let pdfLinks = [];

    // Parcours des tableaux pour récupérer les années et capitaux propres
    $('thead .title-tab th').each((index, element) => {
        const year = $(element).text().trim();
        years.push(year);
    });

    $('tbody tr').each((index, element) => {
        const rowTitle = $(element).find('td.start-tab').text().trim();
        if (rowTitle.includes('Capitaux propres')) {
            $(element).find('td .financial-number').each((i, tdElement) => {
                const capitalText = $(tdElement).text().trim();
                if (capitalText) {
                    capitals.push(capitalText.replace(/\s/g, ''));
                }
            });
        }
    });

    // Extraction des PDF et des dates associées
    const secondTable = $('table.publicaties');
    pdfLinks = secondTable.find('tbody tr').map((index, row) => {
        const date = $(row).find('td[data-header="Date"]').text().trim();
        const pdfUrl = $(row).find('td a.tr-anchor').attr('href');
        const title = $(row).find('td[data-header="Titre"].title-cell span').first().text().trim();

        if (pdfUrl && date && title) {
            return {
                date,
                title,
                url: `https://www.companyweb.be/${pdfUrl}`
            };
        }
    }).get();

    return {
        capital: years.map((year, index) => ({
            year,
            capital: capitals[index * 2]
        })).filter(result => result.capital),
        juridical: pdfLinks
    };
}

const companyIds = ['0403449823', '0403590274', '0403174758'];

// Fonction pour scraper plusieurs sociétés
const scrapeMultipleCompanies = async (companyIds) => {
    const results = [];
    for (const companyId of companyIds) {
        const companyData = await scrapeCompanyData(companyId);
        if (companyData) {
            results.push(companyData);
        }
    }
    return results;
};

// Exécution
scrapeMultipleCompanies(companyIds)
    .then(results => {
        //{ depth: null }
        console.log('Données récupérées:', results);
    })
    .catch(err => console.error(err));

// Total
// scrapeMultipleCompanies(companyIds)
//   .then(results => {
//       console.dir(results, { depth: null });  
//   })
//   .catch(err => console.error(err));

module.exports = scrapeCompanyData;