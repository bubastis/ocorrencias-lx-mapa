const fetch = require('node-fetch')
exports.handler = async () => {
  try {

    const response = await fetch(
      'https://naminharualx.cm-lisboa.pt/gopiv2/proxy.jsp?https://gisapps.cm-lisboa.pt/arcgisapps/rest/services/GOPI_Maps_Secure/NaMinhaRuaRead_PROD/MapServer/0/query?where=1%3D1&outFields=id%2Cnumero%2Crequerente%2Cemail%2Clocal%2Creferencia%2Cdescricao%2Ctipo%2Carea%2Cfreg_descricao%2Cstate%2Cgeo_freguesia_id&orderByFields=id+DESC&resultRecordCount=500&resultOffset=500&f=geojson')

    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }
    const data = await response.json()

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
