let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let ctrl = require('./ctrl');
let cors = require('cors');
const {SkillOrder} = require('./classes')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(cors());
//=======================================
//              Accès libre
//=======================================


app.get('/api/skills', (req, res) => {
  console.log("access")
  console.log(req.query.league)
  skillOrder = new SkillOrder(
    league = req.query.league,
    starttime = req.query.timeInDays*24,
    endtime = 0,
    minlvl = 80,
    maxlvl = 100
    )
  ctrl.getSkills(skillOrder, retour => {
      res.status(retour.code).send(retour);
  });
});


const port = 8081
const server = app.listen(port, () => {
    ctrl.openDB();
    console.log(`Running at http://localhost:${port}`);
  });
  