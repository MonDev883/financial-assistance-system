require("dotenv").config()
const mongoose = require("mongoose")
const Application = require("./models/Application")

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const apps = await Application.find({ selfiePhotoPath: { $regex: /[\\/]/ } })

  for(const a of apps){
    a.selfiePhotoPath = a.selfiePhotoPath.split(/[\\/]/).pop()
    await a.save()
  }

  console.log("Fixed " + apps.length + " records")
  process.exit(0)
})