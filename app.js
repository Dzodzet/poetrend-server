let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let ctrl = require('./ctrl');
let cors = require('cors');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(cors());
//=======================================
//              Accès libre
//=======================================


app.get('/api/skills', (req, res) => {
  //console.log("/api/skills params = ", req.query)
  skillOrder = {
    league: req.query.league,
    starttime: req.query.timeInDays*24,
    endtime: 0,
    minlvl: 80,
    maxlvl: 100
  }
  ctrl.getSkills(skillOrder, retour => {
      res.status(retour.code).send(retour);
  });
});

app.get('/api/sdr', (req, res) => {
  //console.log("/api/sdr params = ", req.query)
  params = {
    league: req.query.league,
    nbDaysHist: req.query.nbDaysHist,
  }
  ctrl.getSdr(params, retour => {
      res.status(retour.code).send(retour);
  });
});

app.get('/api/getDetail', (req, res) => {
  //console.log("/api/getDetail char = ", req.query[0])
  ctrl.getDetail(req.query[0], retour => {
      res.status(retour.code).send(retour);
  });
});


const port = 8081
const server = app.listen(port, () => {
    console.log(`Running at http://localhost:${port}`);
  });
  