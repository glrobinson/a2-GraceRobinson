const http = require( "http" ),
      fs   = require( "fs" ),
      // IMPORTANT: you must run `npm install` in the directory for this assignment
      // to install the mime library if you"re testing this on your local machine.
      // However, Glitch will install it automatically by looking in your package.json
      // file.
      mime = require( "mime" ),
      dir  = "public/",
      port = 3000

const appdata = [
  { id: 1, goal: "Sky dive", cost: 5000, date: 2040, ...deriveFields({cost: 5000, date: 2040})},
  { id: 2, goal: "Go to the moon", cost: 10000, date: 2050, ...deriveFields({cost: 10000, date: 2050})},
  { id: 3, goal: "Meet Tucker Wetmore", cost: 150, date: 2030, ...deriveFields({cost: 150, date: 2030})} 
]
let nextId = 4
function deriveFields(base) {
  const currentY = new Date().getFullYear()
  const complete = Number(base.date) - currentY
  let save = null
  if (complete > 0) {
    save = Math.ceil(Number(base.cost) / (complete * 12))
  } else {
    save = 0
  }
  return { complete, save }
}

const server = http.createServer( function( request,response ) {
  if( request.method === "GET" ) {
    handleGet( request, response )    
  }else if( request.method === "POST" ){
    handlePost( request, response ) 
  }
})

const handleGet = function( request, response ) {
  const filename = dir + request.url.slice( 1 ) 

  if(request.url === "/api/appdata") {
    response.writeHead(200, {"Content-Type": "application/json"})
    return response.end(JSON.stringify(appdata))
  }

  if( request.url === "/" ) {
    sendFile( response, "public/index.html" )
  }else{
    sendFile( response, filename )
  }
}

const handlePost = function( request, response ) {
  let dataString = ""

  request.on( "data", function( data ) {
      dataString += data 
  })

  request.on( "end", function() {
    let load
    try {
      load = JSON.parse(dataString || "{}")
    } catch (e) {
      response.writeHead(400, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ error: "Invalid JSON" }))
      return
    }
    if (request.url === "/submit") {
      const submitGoal = {
        goal: String(load.goal ?? "").trim(),
        cost: Number(load.cost),
        date: Number(load.date)
      }
      const derived = deriveFields(submitGoal)
      const row = { id: nextId++, ...submitGoal, ...derived }
      appdata.push(row)

      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ ok: true, data: appdata }))
      return
    }

    if (request.url === "/update") {
      const idNumber = Number(load.id)
      const findID = appdata.findIndex(r => r.id === idNumber)
      if (findID === -1) {
        response.writeHead(404, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: "Row not found" }))
        return
      }
      const current = appdata[findID]
      const goalUpdated = {
        goal: load.goal !== undefined ? String(load.goal).trim(): current.goal,
        cost:  load.cost  !== undefined ? Number(load.cost): current.cost,
        date:   load.date   !== undefined ? Number(load.date): current.date
      }
      const derived = deriveFields(goalUpdated)
      appdata[findID] = { ...current, ...goalUpdated, ...derived }

      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ ok: true, data: appdata, updated: appdata[findID] }))
      return
    }

    if (request.url === "/delete") {
      const { id } = load
      if (typeof id !== "number") {
        response.writeHead(400, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: "Required: id" }))
        return
      }
      const findID = appdata.findIndex(r => r.id === id)
      if (findID === -1) {
        response.writeHead(404, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: "Row not found" }))
        return
      }
      appdata.splice(findID, 1)
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ ok: true, data: appdata }))
      return
    }

    // ... do something with the data here!!!

    response.writeHead( 200, "OK", {"Content-Type": "application/json" })
    response.end(JSON.stringify({ ok: true, data: appdata }))
  })
}

const sendFile = function( response, filename ) {
   const type = mime.getType( filename ) 

   fs.readFile( filename, function( err, content ) {

     // if the error = null, then we"ve loaded the file successfully
     if( err === null ) {

       // status code: https://httpstatuses.com
       response.writeHeader( 200, { "Content-Type": type })
       response.end( content )

     }else{

       // file not found, error code 404
       response.writeHeader( 404 )
       response.end( "404 Error: File Not Found" )

     }
   })
}

server.listen( process.env.PORT || port )
