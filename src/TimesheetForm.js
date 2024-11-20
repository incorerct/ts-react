// src/TimesheetForm.js
import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

function TimesheetForm() {
  const [employeeName, setEmployeeName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hoursWorked = (new Date(endTime) - new Date(startTime)) / 3600000;
    
    try {
      await addDoc(collection(db, 'timesheets'), {
        name: employeeName,
        startTime: Timestamp.fromDate(new Date(startTime)),
        endTime: Timestamp.fromDate(new Date(endTime)),
        hoursWorked
      });
      setEmployeeName('');
      setStartTime('');
      setEndTime('');
      alert('Timesheet entry added successfully!');
    } catch (error) {
      console.error('Error adding timesheet entry: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Employee Name"
        value={employeeName}
        onChange={(e) => setEmployeeName(e.target.value)}
        required
      />
      <input
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        required
      />
      <input
        type="datetime-local"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        required
      />
      <button type="submit">Add Timesheet Entry</button>
    </form>
  );
}

export default TimesheetForm;
