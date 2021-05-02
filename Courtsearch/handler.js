'use strict';
const { Tabletojson } = require('tabletojson');
const axios = require("axios");
const querystring = require("querystring");

module.exports.courtsearch = async (event) => {
  const requestArray = [];
  const resultArray = [];
  const dataArray = [];
  console.log(event);
  console.log("Trying to pull date info");
  const { searchDate } = JSON.parse(event.body);
  const date = new Date(searchDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  console.log(month, day, year);

  const textToFind = ['MANITOBA PUBLIC INSURANCE', 'MPI'];
  const hearingDate = JSON.stringify(day);
  const hearingMonth = JSON.stringify(month);
  const hearingYear = JSON.stringify(year);
  const locations = [
      {
          courtid: '01',
          location: 'Winnipeg'
      },
      {
          courtid: '02',
          location: 'Brandon'
      },
      {
          courtid: '03',
          location: 'Portage La Prairie'
      },
      {
          courtid: '13',
          location: 'Selkirk'
      },
      {
          courtid: '14',
          location: 'Swan River'
      },
      {
          courtid: '10',
          location: 'Minnedosa'
      }
  ]
  for (const location of locations) {
      const request = axios.get(`https://web43.gov.mb.ca/Registry/DailyCourtHearing/SearchResults?HearingTypeCode=all&LocationCode=${location.courtid}++&SortOrder=H&Day=${hearingDate}&Month=${hearingMonth}&Year=${hearingYear}&X-Requested-With=XMLHttpRequest`);
      requestArray.push(request)
  }

  await axios.all(requestArray).then(axios.spread((...responses) => {
    for (const response of responses) {
        const { data, config: { url } } = response;
        const allData = Tabletojson.convert(data).flat();
        const filtered = allData.filter(hearing => textToFind.some(mpi => hearing["Party Name"].includes(mpi)));
        const location = querystring.parse(url).LocationCode.trim();
        const locationName = locations.find(by => by.courtid === location).location;
        resultArray.push({ 
            filtered,
            locationName,
        });
      }
    })).catch(err => {
      console.error(err);
    });

    for (const location of resultArray) {
      const { filtered, locationName } = location;
      console.log("Push hearings for location", locationName);
      for (const hearing of filtered) {
        dataArray.push({
          location: locationName,
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
  
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin" : "*",
    },
    body: JSON.stringify(dataArray),
  }
};
