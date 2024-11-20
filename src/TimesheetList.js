import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import './TimesheetStyles.css';
import * as XLSX from "xlsx"; // Import the xlsx library


const TimesheetList = () => {
  const [employees, setEmployees] = useState([]);
  const [timesheetData, setTimesheetData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [nextDay, setNextDay] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [nightShiftHours, setNightShiftHours] = useState(0);
  const [holidayTime, setHolidayTime] = useState(0);
  const [normalTime, setNormalTime] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // Start with current month
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Start with current year

  const [sortOrder, setSortOrder] = useState("asc"); // Initial sorting order: ascending
  const [sortBy, setSortBy] = useState("totalTime"); // Default sorting by total time

  const [expandedRows, setExpandedRows] = useState({});

  const [allExpanded, setAllExpanded] = useState(false);

  const [groupFilter, setGroupFilter] = useState("all");


  const handleGroupFilter = (group) => {
    setGroupFilter(group);
  };

  const filteredEmployees = employees.filter(employee => {
    if (groupFilter === "all") {
      return true;  // No filtering, show all employees
    }
    return employee.group === groupFilter;  // Show only employees from the selected group
  });
  
  const toggleAllRows = () => {
    setAllExpanded(!allExpanded);

    // Update individual expandedRows based on the global toggle
    const updatedExpandedRows = {};
    employees.forEach(employee => {
      updatedExpandedRows[employee.id] = !allExpanded;
    });
    setExpandedRows(updatedExpandedRows);
  };

  // Generate all days of the current month
  const generateMonthDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // month is 0-indexed
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(`${month + 1}-${day < 10 ? '0' + day : day}`);
    }
    return days;
  };

  const [today, setToday] = useState(() => {
  const now = new Date();
  const month = now.getMonth() + 1; // JS months are 0-indexed
  const day = now.getDate();
  return `${month}-${day < 10 ? '0' + day : day}`; // Format MM-DD
});


  // Fetch employee and timesheet data from Firestore
  useEffect(() => {
    const fetchEmployees = () => {
      const unsubscribe = onSnapshot(collection(db, "employees"), (snapshot) => {
        const employeeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeeData);
      });
      return unsubscribe;
    };

    const fetchTimesheetData = () => {
      const timesheetDataRef = collection(db, "timesheets");
      const unsubscribe = onSnapshot(timesheetDataRef, (snapshot) => {
        const updatedTimesheetData = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const employeeId = doc.id;
          if (data.hours) {
            updatedTimesheetData[employeeId] = {};
            for (const [date, record] of Object.entries(data.hours)) {
              updatedTimesheetData[employeeId][date] = {
                startTime: record.startTime,
                endTime: record.endTime,
                totalTime: parseFloat(record.totalTime),
                nightShift: parseFloat(record.nightShift),
                holidayTime: parseFloat(record.holidayTime),
                isHoliday: Boolean(record.isHoliday),
                normalTime: parseFloat(record.normalTime) || 0,
              };
            }
          }
        });
        setTimesheetData(updatedTimesheetData);
      });
      return unsubscribe;
    };

    fetchEmployees();
    fetchTimesheetData();
  }, []);

  // Handle the time settings for a specific employee and date
  const handleSetTime = (employeeId, date) => {
    setSelectedEmployee(employeeId);
    setSelectedDate(date);
    setStartTime(timesheetData[employeeId]?.[date]?.startTime || "");
    setEndTime(timesheetData[employeeId]?.[date]?.endTime || "");
    setIsHoliday(timesheetData[employeeId]?.[date]?.isHoliday || false);
    setModalOpen(true);
  };

  // Handle changes in start time
  const handleStartTimeChange = (event) => {
    const newStartTime = event.target.value;
    setStartTime(newStartTime);
    calculateTimes(newStartTime, endTime, nextDay, isHoliday);
  };

  // Handle changes in end time
  const handleEndTimeChange = (event) => {
    const newEndTime = event.target.value;
    setEndTime(newEndTime);
    calculateTimes(startTime, newEndTime, nextDay, isHoliday);
  };

  // Toggle next day status
  const handleNextDayToggle = () => {
    const newNextDay = !nextDay;
    setNextDay(newNextDay);
    calculateTimes(startTime, endTime, newNextDay, isHoliday);
  };

  // Toggle holiday status
// Toggle holiday status
const handleHolidayToggle = () => {
  const newIsHoliday = !isHoliday;
  setIsHoliday(newIsHoliday);

  if (newIsHoliday) {
    // If it's a holiday, reset normal time, night shift time, and total time
    setNormalTime(0);
    setNightShiftHours(0);
    setTotalTime(totalTime);
    setHolidayTime(totalTime); // The holiday time becomes the total time worked
  } else {
    // If it's not a holiday, recalculate times
    calculateTimes(startTime, endTime, nextDay, newIsHoliday);
  }
};




  // Calculate total time, night shift hours, and normal/holiday time
  const calculateTimes = (start, end, isNextDay, isHoliday) => {
    if (!start || !end) return;

    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0);
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0);
    if (isNextDay) endDate.setDate(endDate.getDate() + 1);

// Convert startDate and endDate to Date objects if necessary
const totalTimeInHours = (endDate - startDate) / (1000 * 60 * 60);


const nightShiftStartHour = 22;  // 10:00 PM
const nightShiftEndHour = 6;  // 6:00 AM (next day)

// Initialize nightShiftHours to 0
let nightShiftHours = 0;

// Convert start and end times to decimal hours for easier calculations
let startTime = startDate.getHours() + startDate.getMinutes() / 60;
let endTime = endDate.getHours() + endDate.getMinutes() / 60;

// Case 1: Entire shift is within the night shift period (10 PM to 6 AM)
if ((startTime >= nightShiftStartHour || startTime < nightShiftEndHour) &&
    (endTime >= nightShiftStartHour || endTime < nightShiftEndHour)) {
  nightShiftHours = (endDate - startDate) / (1000 * 60 * 60);  // Entire shift is within night shift
}
// Case 2: Shift starts before 10 PM and ends during or after the night shift (crosses into night shift)
else if (startTime < nightShiftStartHour && (endTime >= nightShiftStartHour || endTime < nightShiftEndHour)) {
  // Calculate hours from 10 PM to end time for night shift
  let nightShiftStartTime = new Date(startDate);
  nightShiftStartTime.setHours(nightShiftStartHour, 0, 0);  // Set to 10:00 PM
  nightShiftHours = (endDate - nightShiftStartTime) / (1000 * 60 * 60);  // Hours from 10 PM onwards
}
// Case 3: Shift starts during the night shift and ends after 6 AM (crosses out of night shift)
else if ((startTime >= nightShiftStartHour || startTime < nightShiftEndHour) && endTime >= nightShiftEndHour) {
  let nightShiftEndTime = new Date(startDate);
  nightShiftEndTime.setHours(nightShiftEndHour, 0, 0);  // Set to 6:00 AM
  nightShiftHours = (nightShiftEndTime - startDate) / (1000 * 60 * 60);  // Hours until 6 AM
}
// Case 4: No night shift overlap (shift is entirely outside 10 PM to 6 AM)
else {
  nightShiftHours = 0;  // No night shift overlap
}

    setTotalTime(totalTimeInHours.toFixed(1));
    setNightShiftHours(nightShiftHours.toFixed(1));

    const normalTime = isHoliday ? 0 : totalTimeInHours - nightShiftHours;
    setNormalTime(normalTime.toFixed(1));

    const holidayTime = isHoliday ? totalTimeInHours : 0;
    setHolidayTime(holidayTime.toFixed(1));
  };

  // Save timesheet data to Firestore
  const saveTimesheetDataToFirebase = async () => {
    try {
      const timesheetDocRef = doc(db, "timesheets", selectedEmployee);
      const timesheetData = (await getDoc(timesheetDocRef)).data()?.hours || {};
      timesheetData[selectedDate] = {
        startTime,
        endTime,
        totalTime: parseFloat(totalTime),
        nightShift: parseFloat(nightShiftHours),
        holidayTime: parseFloat(holidayTime),
        normalTime: parseFloat(normalTime),
        isHoliday,
      };
      await setDoc(timesheetDocRef, { hours: timesheetData });
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving timesheet data:", error);
    }
  };

  // Calculate monthly totals for an employee
  const calculateMonthlyTotal = (employeeId) => {
    let monthlyTotal = {
      normalTime: 0,
      nightShift: 0,
      holidayTime: 0,
      totalTime: 0,
    };

    const monthDays = generateMonthDays(currentYear, currentMonth);
    monthDays.forEach((date) => {
      const data = timesheetData[employeeId]?.[date];
      if (data) {
        monthlyTotal.normalTime += data.normalTime || 0;
        monthlyTotal.nightShift += data.nightShift || 0;
        monthlyTotal.holidayTime += data.holidayTime || 0;
        monthlyTotal.totalTime += data.totalTime || 0;
      }
    });

    return monthlyTotal;
  };

  // Change to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
    if (currentMonth === 0) setCurrentYear(currentYear - 1); // Handle year change
  };

  // Change to next month
  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
    if (currentMonth === 11) setCurrentYear(currentYear + 1); // Handle year change
  };



  const getColorForWorkedHours = (totalWorkedHours, expectedHours) => {
    const diff = totalWorkedHours - expectedHours; // Difference from expected hours
  
    if (diff >= -10 && diff <= 10) {
      // Green range: -10 <= diff <= 10
      const greenIntensity = Math.round(155 + (100 * (10 - Math.abs(diff)) / 10)); // 155 to 255
      return `rgb(0, ${greenIntensity}, 0)`; // Shades from dark green to bright green
    } else if (diff < -10) {
      // Red range: diff < -10 (underperformance)
      const adjustedDiff = Math.min(Math.abs(diff) - 10, 50); // Scaling factor
      const redIntensity = Math.round(100 + (155 * adjustedDiff / 50)); // 100 to 255 (more dramatic red)
      return `rgb(${redIntensity}, 0, -1)`; // Shades from dark red to bright red
    } else {
      // Yellow range: diff > 10 (overperformance)
      const adjustedDiff = Math.min(diff - 10, 40); // Scaling factor
      const yellowIntensity = Math.round(155 + (100 * adjustedDiff / 40)); // 155 to 255
      return `rgb(${yellowIntensity}, ${yellowIntensity}, 0)`; // Shades from dark yellow to bright yellow
    }
  };

  // Get the days for the selected month
  const monthDays = generateMonthDays(currentYear, currentMonth);


  const handleSort = (column) => {
  const newSortOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc"; // Toggle sort order
  setSortBy(column); // Set the column to sort by
  setSortOrder(newSortOrder); // Update the sort order

  // Sort the employees based on the selected column and order
  const sortedEmployees = [...employees].sort((a, b) => {
    const totalA = calculateMonthlyTotal(a.id)[column];
    const totalB = calculateMonthlyTotal(b.id)[column];

    if (newSortOrder === "asc") {
      return totalA - totalB;
    } else {
      return totalB - totalA;
    }
  });
  setEmployees(sortedEmployees); // Set the sorted employees list
};
const exportToExcel = () => {
  // Prepare the data for export
  const sheetData = [];
  
  // Header row without the "Date:" prefix
  const headerRow = ["Employee Name", "Shift Type", ...monthDays.map(date => date), "Total"];
  sheetData.push(headerRow);

  // Create an array to hold the merges
  const merges = [];

  // Iterate through the employees and their timesheet data
  employees.forEach((employee) => {
    const monthlyTotal = calculateMonthlyTotal(employee.id);
    
    // Create a row for each shift type (Regular, Night, Holiday, Total)
    const rows = [
      {
        shiftType: "Regular",
        data: monthDays.map(date => {
          const data = timesheetData[employee.id]?.[date];
          return data ? data.normalTime.toFixed(1) : "0";
        }),
        total: monthlyTotal.normalTime.toFixed(1),
      },
      {
        shiftType: "Night",
        data: monthDays.map(date => {
          const data = timesheetData[employee.id]?.[date];
          return data ? data.nightShift.toFixed(1) : "0";
        }),
        total: monthlyTotal.nightShift.toFixed(1),
      },
      {
        shiftType: "Holiday",
        data: monthDays.map(date => {
          const data = timesheetData[employee.id]?.[date];
          return data ? data.holidayTime.toFixed(1) : "0";
        }),
        total: monthlyTotal.holidayTime.toFixed(1),
      },
      {
        shiftType: "Total",
        data: monthDays.map(date => {
          const data = timesheetData[employee.id]?.[date];
          return data ? data.totalTime.toFixed(1) : "0";
        }),
        total: monthlyTotal.totalTime.toFixed(1),
      }
    ];

    // For each shift type, add a row and also merge the "Employee Name" cell for all related rows
    let startRow = sheetData.length;
    rows.forEach((row, index) => {
      const newRow = [
        index === 0 ? employee.name : "", // Merge the "Employee Name" across rows
        row.shiftType,
        ...row.data,
        row.total,
      ];
      sheetData.push(newRow);
      
      // If it's the first row for this employee, mark the merge range
      if (index === 0) {
        merges.push({
          s: { r: startRow, c: 0 }, // Start row and column (Employee Name column)
          e: { r: startRow + rows.length - 1, c: 0 } // End row and column (same column, spanning rows)
        });
      }

      // Highlight the "Total" row with a specific background color
      if (row.shiftType === "Total") {
        // Add background color for "Total" row (assuming this is index 3)
        const lastRow = sheetData.length - 1;
        for (let col = 0; col < sheetData[lastRow].length; col++) {
          // Set the cell value and its style
          sheetData[lastRow][col] = {
            v: sheetData[lastRow][col], 
            s: { fill: { fgColor: { rgb: "FFFF00" } } } // Yellow background
          };
        }
      }
    });
  });

  // Create a worksheet and workbook from the data
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Add the merge instruction to the worksheet
  ws['!merges'] = merges;

  // Create the workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheets");

  // Export the workbook to Excel
  XLSX.writeFile(wb, "timesheet_data.xlsx");
};


const toggleRowExpansion = (employeeId) => {
  setExpandedRows((prevState) => ({
    ...prevState,
    [employeeId]: !prevState[employeeId], // Toggle the expansion state
  }));
};



return (
  <div>
    <div className="month-navigation" style={{ position: "relative" }}>
      <button onClick={goToPreviousMonth}>Previous Month</button>
      <span>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
      <button onClick={goToNextMonth}>Next Month</button>

      <button 
        onClick={exportToExcel}
        style={{
          padding: "10px",
          fontSize: "15px", 
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer",
          position: "absolute",
          right: "10px",  // Align to the right edge
          top: "0px"     // Position below the month navigation
        }}
      >
        Export to Excel
      </button>
    </div>

    {/* Add the "Expand All / Collapse All" and Group Filter buttons */}
    <div style={{ marginBottom: "10px" }}>
    <button
  onClick={toggleAllRows}
  style={{
    padding: "10px",
    fontSize: "15px",
    backgroundColor: allExpanded ? "#4CAF50" : "#4CAF50",  // Red for collapse, green for expand
    color: "white",
    border: "none",
    cursor: "pointer"
  }}
>
  {allExpanded ? "Collapse All" : "Expand All"}
</button>

<button 
  onClick={() => handleGroupFilter("1")} 
  style={{ 
    padding: "10px", 
    fontSize: "15px", 
    width: "80px" // Set a fixed width for all buttons
  }}
>
  Group 1
</button>

<button 
  onClick={() => handleGroupFilter("2")} 
  style={{ 
    padding: "10px", 
    fontSize: "15px", 
    width: "80px" // Same width as the other button
  }}
>
  Group 2
</button>

<button 
  onClick={() => handleGroupFilter("all")} 
  style={{ 
    padding: "10px", 
    fontSize: "15px", 
    width: "80px" // Same width as the other buttons
  }}
>
  All   
</button>

    </div>

    <table border="1">
      <thead>
        <tr>
          <th>Name</th>
          <th>Shift</th>
          {monthDays.map((date, index) => {
            // Check if it's today's date
            const isToday = date === today;
            return (
              <th
                key={date}
                className={isToday ? "highlight-today" : ""}
              >
                {parseInt(date.split('-')[1], 10)}
              </th>
            );
          })}
          <th
            onClick={() => handleSort("totalTime")} // Call the sort handler on click
            style={{ cursor: "pointer" }}
          >
            Monthly Total {sortBy === "totalTime" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredEmployees.map((employee, employeeIndex) => {
          const monthlyTotal = calculateMonthlyTotal(employee.id);

          // Filter the monthDays to get only the days up until today
          const filteredDays = monthDays.filter(date => new Date(date) <= new Date(today));

          // Calculate the number of weekdays (excluding weekends) up until today
          const expectedWeekdays = filteredDays.filter(date => {
            const day = new Date(date).getDay(); // Get the day of the week (0 = Sunday, 6 = Saturday)
            return day !== 0 && day !== 6; // Only weekdays (exclude weekends)
          }).length;

          // Calculate the total expected hours up until today (expected weekdays * 8 hours per day)
          const totalExpectedHours = expectedWeekdays * 8;

          // Calculate the total worked hours up until today
          const totalWorkedHours = filteredDays.reduce((acc, date) => {
            const employeeData = timesheetData[employee.id]?.[date] || {};
            return acc + (employeeData.normalTime || 0) + (employeeData.nightShift || 0) + (employeeData.holidayTime || 0);
          }, 0);

          // Get the color for the Total row based on the worked hours vs expected hours
          const totalRowColor = getColorForWorkedHours(totalWorkedHours, totalExpectedHours);

          const isExpanded = expandedRows[employee.id]; // Check if the row is expanded

          return (
            <React.Fragment key={employee.id}>
              {/* Main row for employee with the name cell to toggle expansion */}
              <tr
                className={`row ${employeeIndex % 2 === 0 ? "odd-row" : "even-row"}`}
                style={{ backgroundColor: "lightgreen" }} // Regular shift row color
              >
                <td
                  rowSpan={isExpanded ? 4 : 1}
                  onClick={() => toggleRowExpansion(employee.id)} // Click on the name to toggle expansion
                  style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  {employee.name}
                </td>

                {/* Conditionally render Total row if collapsed */}
                {!isExpanded ? (
                  <>
                    <td>Total</td>
                    {monthDays.map((date) => (
                      <td
                        key={date}
                        onClick={() => handleSetTime(employee.id, date)}
                        className={date === today ? "highlight-today" : ""}
                      >
                        {timesheetData[employee.id]?.[date]?.totalTime === 0
                          ? "0"
                          : timesheetData[employee.id]?.[date]?.totalTime
                          ? `${timesheetData[employee.id][date].totalTime.toFixed(1)}`
                          : ""}
                      </td>
                    ))}
                    <td style={{ backgroundColor: totalRowColor }}>{monthlyTotal.totalTime.toFixed(1)}</td>
                  </>
                ) : (
                  <>
                    {/* Show Regular Row when Expanded */}
                    <td>Regular</td>
                    {monthDays.map((date) => (
                      <td
                        key={date}
                        onClick={() => handleSetTime(employee.id, date)}
                        className={date === today ? "highlight-today" : ""}
                      >
                        {timesheetData[employee.id]?.[date]?.normalTime === 0
                          ? "0"
                          : timesheetData[employee.id]?.[date]?.normalTime
                          ? `${timesheetData[employee.id][date].normalTime.toFixed(1)}`
                          : ""}
                      </td>
                    ))}
                    <td>{monthlyTotal.normalTime.toFixed(1)}</td>
                  </>
                )}
              </tr>

              {/* Display expanded rows if expanded */}
              {isExpanded && (
                <>
                  {/* Night Shift Row */}
                  <tr
                    className={`row ${employeeIndex % 2 === 0 ? "odd-row" : "even-row"}`}
                    style={{ backgroundColor: "lightblue" }} // Night shift row color
                  >
                    <td>Night</td>
                    {monthDays.map((date) => (
                      <td
                        key={date}
                        onClick={() => handleSetTime(employee.id, date)}
                        className={date === today ? "highlight-today" : ""}
                      >
                        {timesheetData[employee.id]?.[date]?.nightShift === 0
                          ? "0"
                          : timesheetData[employee.id]?.[date]?.nightShift
                          ? `${timesheetData[employee.id][date].nightShift.toFixed(1)}`
                          : ""}
                      </td>
                    ))}
                    <td>{monthlyTotal.nightShift.toFixed(1)}</td>
                  </tr>

                  {/* Holiday Row */}
                  <tr
                    className={`row ${employeeIndex % 2 === 0 ? "odd-row" : "even-row"}`}
                    style={{ backgroundColor: "lightcoral" }} // Holiday row color
                  >
                    <td>Holiday</td>
                    {monthDays.map((date) => (
                      <td
                        key={date}
                        onClick={() => handleSetTime(employee.id, date)}
                        className={date === today ? "highlight-today" : ""}
                      >
                        {timesheetData[employee.id]?.[date]?.holidayTime === 0
                          ? "0"
                          : timesheetData[employee.id]?.[date]?.holidayTime
                          ? `${timesheetData[employee.id][date].holidayTime.toFixed(1)}`
                          : ""}
                      </td>
                    ))}
                    <td>{monthlyTotal.holidayTime.toFixed(1)}</td>
                  </tr>

                  {/* Total Row */}
                  <tr
                    style={{
                      backgroundColor: totalRowColor, // Apply the color to the entire Total row
                    }}
                  >
                    <td>Total</td>
                    {monthDays.map((date) => (
                      <td
                        key={date}
                        onClick={() => handleSetTime(employee.id, date)}
                        className={date === today ? "highlight-today" : ""}
                      >
                        {timesheetData[employee.id]?.[date]?.totalTime === 0
                          ? "0"
                          : timesheetData[employee.id]?.[date]?.totalTime
                          ? `${timesheetData[employee.id][date].totalTime.toFixed(1)}`
                          : ""}
                      </td>
                    ))}
                    <td>{monthlyTotal.totalTime.toFixed(1)}</td>
                  </tr>
                </>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>

    {modalOpen && (
      <div className="modal1">
        <div className="modal-content1">
          <h2 className="modal-heading1">Timesheet Details</h2>
          
          <div className="form-container1">
            <label className="form-label1">
              Start Time:
              <input
                type="text"
                value={startTime}
                onChange={handleStartTimeChange}
                className="input-field1"
                placeholder="hh:mm"
              />
            </label>
            
            <label className="form-label1">
              End Time:
              <input
                type="text"
                value={endTime}
                onChange={handleEndTimeChange}
                className="input-field1"
                placeholder="hh:mm"
              />
            </label>

            <div className="checkbox-container1">
              <label className="checkbox-label1">
                <span>Next Day:</span>
                <input
                  type="checkbox"
                  checked={nextDay}
                  onChange={handleNextDayToggle}
                  className="checkbox-input1"
                />
              </label>

              <label className="checkbox-label1">
                <span>Is Holiday:</span>
                <input
                  type="checkbox"
                  checked={isHoliday}
                  onChange={handleHolidayToggle}
                  className="checkbox-input1"
                />
              </label>
            </div>
            
            <div className="time-summary1">
              <p>Total Time: {totalTime} hours</p>
              <p>Night Shift Hours: {nightShiftHours} hours</p>
              <p>Normal Time: {normalTime} hours</p>
              <p>Holiday Time: {holidayTime} hours</p>
            </div>
            
            <div className="modal-actions1">
              <button onClick={saveTimesheetDataToFirebase} className="save-btn1">Save</button>
              <button className="close-btn1" onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

};

export default TimesheetList;
