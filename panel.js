// wow global state much!?!!
let AD_CALLS = [];
const TABLE_HEADERS = [
  "ad_index",
  "article_position",
  "blogName",
  "category",
  "page",
  "pos",
  "postId",
  "tags",
  "google-creative-id",
  "google-lineitem-id"
];

const themeName =
  chrome.devtools.panels.themeName === "dark" ? "ChromeDark" : "ChromeDefault";

// hard coded the DFP ad request here but eventually we could support different ad servers
function isAdRequest(request) {
  return request.request.url.startsWith(
    "https://securepubads.g.doubleclick.net/gampad/ads"
  );
}

// whether or not this request was successful given its status.
// Eventually I want to add a "hide duplicate requests" option to the tool
// so it wouldn't just be status 200.
function isRequestSuccessful(request) {
  return request.response.status === 200;
}

function getQueryParams(str) {
  return str
    .replace(/(^\?)/, "")
    .split("&")
    .map(
      function(n) {
        return (n = n.split("=")), (this[n[0]] = n[1]), this;
      }.bind({})
    )[0];
}

function getAdMeta(request) {
  let cleanCustomParams, cleanScpParams;
  const { queryString } = request.request;
  const { headers } = request.response;
  const customParams = queryString.find(queryStringElement => {
    return queryStringElement.name === "cust_params";
  });
  if (customParams) {
    cleanCustomParams = getQueryParams(unescape(unescape(customParams.value)));
  }
  const scpParams = queryString.find(queryStringElement => {
    return queryStringElement.name === "scp";
  });
  if (scpParams) {
    cleanScpParams = getQueryParams(unescape(unescape(scpParams.value)));
  }
  const googleParams = {};
  const googleCreativeId = headers.find(
    header => header.name === "google-creative-id"
  );
  if (googleCreativeId) {
    googleParams["google-creative-id"] = googleCreativeId.value;
  }
  const googleLineItemId = headers.find(
    header => header.name === "google-lineitem-id"
  );
  if (googleLineItemId) {
    googleParams["google-lineitem-id"] = googleLineItemId.value;
  }
  return Object.assign(cleanCustomParams, cleanScpParams, googleParams);
}

function getTableRows(tableRows = AD_CALLS) {
  return tableRows
    .map(
      tableRow => `<tr>
    ${TABLE_HEADERS.map(
      tableHeaderKey => `<td title="${tableRow[tableHeaderKey]}">${tableRow[tableHeaderKey]}</td>`
    ).join("")}
    </tr>`
    )
    .join("");
}

function getTableHeaders(tableHeaders = TABLE_HEADERS) {
  return tableHeaders
    .map(tableHeader => `<th><div>${tableHeader}</div></th>`)
    .join("");
}

function updateTable(adCalls) {
  const tableRows = getTableRows(adCalls);
  document.body.innerHTML = `
  <div class="vbox widget root-view">
    <div class="data-grid">
      <table>
        <thead>
          <tr>${getTableHeaders()}</tr>
        </thead>
        <tbody>
          ${getTableRows()}
          <tr style="height: auto;">
          ${TABLE_HEADERS.map(() => `<td class="bottom-filler-td"></td>`).join("")}
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

chrome.devtools.network.onRequestFinished.addListener(function(request) {
  if (themeName === "ChromeDark") {
    document.body.className = "dark-theme";
  }
  if (isRequestSuccessful(request) && isAdRequest(request)) {
    const adMeta = getAdMeta(request);
    AD_CALLS.push(adMeta);
    updateTable();
  }
});

// clear on navigation
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo && changeInfo.status === "loading") {
    chrome.storage.local.get(["preserveLog"], function(result) {
      if (result.preserveLog === true) {
        return;
      } else {
        AD_CALLS = [];
        updateTable();
      }
    });
  }
});
