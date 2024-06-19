const { MongoClient } = require('mongodb')

let dbConnection

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect('mongodb+srv://Lusty:Lusty50861407@lustyflix.de1oulx.mongodb.net/AdultDVDEmpire?retryWrites=true&w=majority&appName=LustyFlix')
      .then(client => {
        dbConnection = client.db()
        return cb()
      })
      .catch(err => {
        console.log(err)
        return cb(err)
      })
  },
  getDb: () => dbConnection
}