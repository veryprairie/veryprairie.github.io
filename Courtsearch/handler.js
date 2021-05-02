const puppeteer = require("puppeteer-core");

'use strict';

async function scrapeData(location, date, browser) {

  //Converting Date Request to usable Values
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  console.log(month, day, year);  

  //Opening Headless Browser - Navigating to Court Registry

  console.log("SCRAPE0")

  const page = await browser.newPage();
  const textToFind = ['MANITOBA PUBLIC INSURANCE', 'MPI'];
  const hearingDate = JSON.stringify(day);
  const hearingMonth = JSON.stringify(month);
  const hearingYear = JSON.stringify(year);

  await page.goto(`https://web43.gov.mb.ca/Registry/DailyCourtHearing/DateSelect?LocationCode=${location}%20%20&LocationDesc=&HearingTypeCode=all&HearingTypeDesc=ALL%20HEARING%20TYPES`, { "waitUntil": 'networkidle2' });

  // Enter Date in Registry
  try {
    const dateField = await page.$('#Day');
    await dateField.click({ clickCount: 2 });
    await page.type('#Day', hearingDate);

    const monthField = await page.$('#Month');
    await monthField.click({ clickCount: 1 })
    await page.select('#Month', hearingMonth);

    const yearField = await page.$('#Year');
    await yearField.click({ clickCount: 2 })
    await page.type('#Year', hearingYear);
  } catch (err) {
    console.log("Whoops", err);
    await browser.close();
  }
  // Date entered

  console.log("SCRAPE1 for " + location)
  // Search Registry
  await page.waitForSelector("#hearingsearchbutton");
  await page.click("#hearingsearchbutton");
  await page.waitForTimeout(1000);
  // Registry Data Pulled
  console.log("SCRAPE2")
  // Assembling Data into Array
  const pullData = await page.evaluate(() => {
    const headers = [];
    $('#searchResults th').each(function(index, item) {
      headers[index] = $(item).text().trim();
    });
    const array = [];
    $('#searchResults tr').has('td').each(function () {
      var arrayItem = {};
      $('td', $(this)).each(function (index, item) {
          arrayItem[headers[index]] = $(item).text().trim();
      });
      array.push(arrayItem);
    });
    return array;
  });
  console.log(pullData);
  const filtered = pullData.filter(hearing => textToFind.some(mpi => hearing["Party Name"].includes(mpi)));
  console.log(filtered);
  return filtered;
}

module.exports.courtsearch = async (event) => {
  const dataArray = [];
  console.log(event);
  console.log("Trying to pull date info");
  const { searchDate } = JSON.parse(event.body);
    const dateSelect = new Date(searchDate);
    const locations = [
        {
            courtid: '01',
            location: 'Winnipeg'
        },
        {
            courtid: '02',
            location: 'Brandon'
        },
        // {
        //     courtid: '03',
        //     location: 'Portage La Prairie'
        // },
        // {
        //     courtid: '13',
        //     location: 'Selkirk'
        // },
        // {
        //     courtid: '14',
        //     location: 'Swan River'
        // },
        // {
        //     courtid: '10',
        //     location: 'Minnedosa'
        // }
    ]
  const browser = await puppeteer.connect({ browserWSEndpoint: "http://EC2Co-EcsEl-1A76G3YJGEK6J-1147292357.us-east-1.elb.amazonaws.com:3000" }).catch(err => console.error("Failed to connect to Browserless!", err));
  for (var i = 0; i < locations.length; i++){
    const data = await scrapeData(locations[i].courtid, dateSelect, browser);
    if (!data || !data.length) console.log("No hearings available at this location!");
    for (hearing of data) {
      console.log("Push hearing",hearing, "for location", locations[i].location);
      dataArray.push({
        location: locations[i].location,
        party: hearing["Party Name"],
        file: {
          name: hearing["File #"],
          url: `https://web43.gov.mb.ca/Registry/FileNumberSearch/SearchResults?FileNumber=${hearing["File #"]}`
        },
        date: hearing["Court Date"],
        time: hearing["Court Time"],
        details: hearing["Hearing Type"],
      });
    }
  }

  await browser.close();
  
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin" : "*",
    },
    body: JSON.stringify(dataArray),
  }
};
