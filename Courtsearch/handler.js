const puppeteer = require("puppeteer-core");
// const express = require ('express');
// const asyncHandler = require('express-async-handler');
// const mysql = require('mysql');
// const bodyParser = require('body-parser');

'use strict';

async function scrapeData(location, date, browser) {

  //Converting Date Request to usable Values
  const month = date.getMonth() + 1;
  const day = date.getDate() + 1;
  const year = date.getFullYear();

  console.log(month, day, year);  

  //Opening Headless Browser - Navigating to Court Registry

  console.log("SCRAPE0")

  const page = await browser.newPage();
  const textToFind = 'MANITOBA PUBLIC INSURANCE';
  const altTextToFind = 'MPI';
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

  console.log("After year click")
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
    const regData = Array.from(document.querySelectorAll('#searchResults > table tr td'))
    return regData.map(td => td.innerText)
  });
  console.log("SCRAPE3 for " + location)
  console.log(pullData[0])
  // Filtering Array for MPI Values - Inserting Values into Array of Objects
  let datesMPI = [];

  var count = 0;
  for (var i = 0; i < pullData.length; ++i) {

    // PUSH MPI into array of objects
    if (pullData[i].includes(textToFind)) {
      console.log(pullData[i]);
      let newDate = {
        "party": pullData[i],
        "file_no": pullData[i + 2],
        "date": pullData[i + 3],
        "time": pullData[i + 4],
        "details": pullData[i + 5]
      }
      datesMPI.push(newDate)
    } else if (pullData[i].includes(altTextToFind)) {
      let newDate = {
        "party": pullData[i],
        "file_no": pullData[i + 2],
        "date": pullData[i + 3],
        "time": pullData[i + 4],
        "details": pullData[i + 5]
      }
      datesMPI.push(newDate)
    }
  }
  //PUSH related matters to corresponding objects
  let allrelDates = [];
  for (var i = 0; i < pullData.length; ++i) {
    for (var j = 0; j < datesMPI.length; ++j) {

      if (pullData[i] == datesMPI[j].file_no && !pullData[i - 2].includes(textToFind)) {

        let newDate = {
          "party": pullData[i - 2],
          "file_no": pullData[i + 0],
          "date": pullData[i + 1],
          "time": pullData[i + 2],
          "details": pullData[i + 3]
        }
        allrelDates.push(newDate)
      }
    }
  }
  console.table(allrelDates)

  const filt = allrelDates.reduce((acc, current) => {
    const x = acc.find(item => item.file_no === current.file_no);
    if (!x) {

      current.party = [current.party]
      acc.push(current);

    } else {
      x.party.push(current.party)

    }
    return acc;
  }, []);

  console.table(filt)
  return filt
}

function buildTable(datesMPI) {
  console.log(datesMPI);

  //Results Page Return Button

  let result = '<table class="table table-striped">';

  //Constructing Results in HTML Table

  result += '<tr class="bg-info"><th>Party</th><th>File No.</th><th>Date</th><th>Time</th><th>Details</th></tr>'
  if (datesMPI.length === 0) {
    result += '<tr><td>No Hearings Scheduled</td></tr></table>'
    return result
  } else {
    for (var i = 0; i < datesMPI.length; i++) {
      var row = `<tr>
                  <td>${datesMPI[i].party}</td>
                  <td><a href="https://web43.gov.mb.ca/Registry/FileNumberSearch/SearchResults?FileNumber=${datesMPI[i].file_no}" target="_blank">${datesMPI[i].file_no}</a></td>
                  <td>${datesMPI[i].date}</td>
                  <td>${datesMPI[i].time}</td>
                  <td>${datesMPI[i].details}</td>
             </tr>`
      result += row
    };
    result += '</table></body>';
    //Table Constructed

    console.log(result);

    return result
  }
}

module.exports.courtsearch = async (event) => {
  console.log(event);
  console.log("Trying to pull date info");
  console.log("Buffer", Buffer.from(event.body, 'base64').toString('utf-8'));
  const stringifiedBody = Buffer.from(event.body, 'base64').toString('utf-8');
  const searchDate = stringifiedBody.split("=")[1];
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
  const browser = await puppeteer.connect({ browserWSEndpoint: "http://EC2Co-EcsEl-1A76G3YJGEK6J-1147292357.us-east-1.elb.amazonaws.com:3000" });
  let finalTable = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous"><style>body{background: skyblue; font-family: verdana; color: #fff; padding: 30px;}</style><h1>COURT DATES</h1>'
  finalTable += '<body><form method ="get" action="/form.html"><label><button>Select New Date</button></label></form>'
  // let datesMPI = await scrapeData(locations[0], dateSelect)
  // console.log("This is result of scrapeData" + datesMPI)
  for (var i = 0; i < locations.length; i++){
    const data = await scrapeData(locations[i].courtid, dateSelect, browser);
    finalTable += `<h2>${locations[i].location}</h2><br>`;
    const table = buildTable(data);
    finalTable += table;
  }

  console.log(finalTable);

  await browser.close();
  
  return {
    statusCode: 200,
    body: finalTable,
  }
};
