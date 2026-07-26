const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const sequelize = require("./config/db/mysql");

require("dotenv").config();
const PORT = process.env.PORT || 3001;
const routes = require('./routes/index');
const app = express();
app.use(cors());
app.use(morgan('dev'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', routes);
app.use('/api', routes);

(async () => {
    try {

        await sequelize.authenticate();

        console.log("✅ Database Connected");

    } catch (error) {

        console.log("❌ Database Error:", error.message);

    }
})();

app.listen(PORT , ()=>{
    console.log(`App is runnig on ${PORT}`);
})