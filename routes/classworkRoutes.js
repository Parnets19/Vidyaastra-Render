const express = require('express');
const router = express.Router();
const classworkController = require('../controllers/classworkController');
const multer = require('multer');
const upload =multer({});


router.get("/all-unfiltered", classworkController.getAllClassworkUnfiltered)
router.get('/by-school', classworkController.getAllClassworkBySchoolId); // NEW: Route to get classwork by schoolId only

router.get(
  "/by-class-names",
  classworkController.getClassworkByClassNames
);
 router.get('/', classworkController.getAllClasswork);

 router.post(
  '/', 
  upload.array('attachments', 5), // Max 5 files
  classworkController.createClasswork
);

 router.put(
  '/:id', 
  upload.array('attachments', 5),
  classworkController.updateClasswork
);

 router.delete('/:id', classworkController.deleteClasswork);

 router.delete('/:id/attachments/:attachmentId', classworkController.deleteAttachment);

module.exports = router;