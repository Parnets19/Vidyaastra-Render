const express = require("express");
const router = express.Router();
const classController = require("../controllers/ClassName");

// Routes
router.post('/addclass',classController.createClass);
router.get('/classes',classController.getClasses);
router.put('/updateclass/:id',classController.updateClass);
router.delete('/deleteclass/:id',classController.deleteClass);
router.post('/addsession',classController.createSession);
router.get('/sessions',classController.getSessions);
router.put('/updatesession/:id',classController.updatedSession);
router.delete('/deletesession/:id',classController.deleteSession);

module.exports = router;