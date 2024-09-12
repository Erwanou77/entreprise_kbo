const cheerio = require('cheerio');
const request = require('./request');

const scrapeCompanyData = async (companyId) => {
    const kbopubData = await request(
        `https://kbopub.economie.fgov.be/kbopub/toonvestigingps.html?lang=fr&ondernemingsnummer=${companyId}`,
        'get',
        null,
        null
    );

    if (!kbopubData){
        console.error("kbopubData data is null");
        return null
    }
    const $ = cheerio.load(kbopubData);
    const result =  { 
        [ extractGeneral($,'kbopub').enterpriseNumber]: {
                name: extractGeneral($,'kbopub').name,
                status:extractGeneral($,'kbopub').status,
                address:extractGeneral($,'kbopub').address,
                startDate:extractGeneral($,'kbopub').startDate
            }
        };
        

    const kbopubDataSingle = await request(
        `https://kbopub.economie.fgov.be/kbopub/toonondernemingps.html?lang=fr&ondernemingsnummer=${companyId}`,
        'get',
        null,
        null
    )
    if (!kbopubData){
        console.error("kbopubDataSingle data is null");
        return null
    }
 
    const singleData = cheerio.load(kbopubDataSingle)

    result[extractGeneral($,'kbopub').enterpriseNumber] = {
        ...result[extractGeneral($,'kbopub').enterpriseNumber],
        director: extractGeneral(singleData,'kbopub').gerant,
        website: extractGeneral(singleData,'kbopub').website,
    
    };

    const companywebData = await request(
        `https://www.companyweb.be/fr/${companyId}`,
        'get',
        null,
        null

    )
    if (!companywebData){
        console.error("companywebData data is null");
        return null
    }

    const companywebHtml = cheerio.load(companywebData)
    result[extractGeneral($,'kbopub').enterpriseNumber] = {
        ...result[extractGeneral($,'kbopub').enterpriseNumber],
        capital: extractGeneral(companywebHtml,'companyweb').capital ,
        juridical: extractGeneral(companywebHtml,'companyweb').juridical ,

    };


    return result;
};

function extractGeneral($, website) {
    const years = [];
    const capitals = [];
    let pdfLinks = [];
    
    if (website == 'companyweb'){
   
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

        const secondTable = $('table.publicaties');
        pdfLinks = secondTable.find('tbody tr').map((index, row) => {
            const date = $(row).find('td[data-header="Date"]').text().trim();
            const pdfUrl = $(row).find('td a.tr-anchor').attr('href');
            const title = $(row).find('td[data-header="Titre"].title-cell span').first().text().trim().replaceAll('\n\n', '').replaceAll('\n', '').replaceAll('  ', ' ');

            if (pdfUrl && date && title) {
                const fullUrl = `https://www.companyweb.be/${pdfUrl}`;
                return {
                    date,
                    title,
                    url: fullUrl
                };
            }
        }).get();
    }
   
    return {
        enterpriseNumber: $('td:contains("entreprise:")').next().text()?.trim(),
        startDate: $('td:contains("Date de début:")').next().text()?.trim(),
        name: $('td:contains("Dénomination de l\'unité")').next().text()?.trim()?.split('Dénomination')[0],
        email: $('td:contains(E-mail:")').next().text()?.trim(),
        gerant: $('td:contains(Gérant)').next().text().trim(),
        website:  $('td:contains(Adresse web)').next().text().trim(),
        capital: years.map((year, index) => ({
            year: year,
            capital: capitals[index * 2]
        })).filter(result => result.capital !== undefined),
        juridical: pdfLinks
    };
}


module.exports = scrapeCompanyData;