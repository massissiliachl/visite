const express = require('express');
const router = express.Router();

const {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  updateReservationStatus,
  deleteReservation
} = require('../controllers/reservationController');

router.post('/', createReservation);
router.get('/', getAllReservations);
router.get('/:id', getReservationById);
router.put('/:id', updateReservation);
router.put('/:id/accept', (req, res, next) => {
  req.body = { ...req.body, status: 'acceptee' };
  return updateReservationStatus(req, res, next);
});
router.put('/:id/refuse', (req, res, next) => {
  req.body = { ...req.body, status: 'refusee' };
  return updateReservationStatus(req, res, next);
});
router.put('/:id/status', updateReservationStatus);
router.delete('/:id', deleteReservation);

module.exports = router;
