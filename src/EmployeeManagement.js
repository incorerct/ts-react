import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Import the Firestore db instance
import * as XLSX from "xlsx"; // Import the xlsx library

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    phone: "",
    sap: "",
    group: "", // Add group field
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "employees"));
        const employeeData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      if (!newEmployee.name || !newEmployee.phone || !newEmployee.sap || !newEmployee.group) {
        alert("Please fill all fields!");
        return;
      }
      const docRef = await addDoc(collection(db, "employees"), newEmployee);
      setEmployees((prev) => [...prev, { id: docRef.id, ...newEmployee }]);
      setNewEmployee({ name: "", phone: "", sap: "", group: "" });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  };

  const handleDoubleClick = (employee, field) => {
    setEditingEmployee({ ...employee, fieldToEdit: field });
  };

  const handleUpdateEmployee = async () => {
    try {
      if (!editingEmployee) return;

      const employeeDoc = doc(db, "employees", editingEmployee.id);
      await updateDoc(employeeDoc, {
        name: editingEmployee.name,
        phone: editingEmployee.phone,
        sap: editingEmployee.sap,
        group: editingEmployee.group,
      });

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editingEmployee.id ? editingEmployee : emp))
      );
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this employee?");
    if (isConfirmed) {
      try {
        const employeeDoc = doc(db, "employees", employeeId);
        await deleteDoc(employeeDoc);
        setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((employee) => {
    return (
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone.includes(searchTerm) ||
      employee.sap.toString().includes(searchTerm) ||
      employee.group.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setEmployees(sortedEmployees);
  };

  // Function to export employee data to Excel
  const exportToExcel = () => {
    const filteredData = employees.map(({ name, phone, sap, group }) => ({
      Group: group,
      Name: name,
      Phone: phone,
      SAP: sap,
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(workbook, "Employees.xlsx");
  };

  // Handle "Enter" key press to save updates
  const handleKeyDown = (e, field) => {
    if (e.key === "Enter") {
      handleUpdateEmployee();
    }
  };

  return (
    <div className="employee-management">
      <div className="header">
        <input
          type="search"
          placeholder="Search Employees..."
          value={searchTerm}
          onChange={handleSearchChange}
        />

        <div className="button-container">
          <button className="add-employee-btn" onClick={() => setIsModalOpen(true)}>
            Add New Employee
          </button>

          <button className="export-btn" onClick={exportToExcel}>
            Export to Excel
          </button>
        </div>
      </div>

      <h3>Employee List</h3>
      <table className="employee-table" border="1">
        <thead>
          <tr>
            <th onClick={() => handleSort("group")}>Group</th> {/* New column for Group */}
            <th onClick={() => handleSort("name")}>Name</th>
            <th onClick={() => handleSort("phone")}>Phone</th>
            <th onClick={() => handleSort("sap")}>SAP</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td onDoubleClick={() => handleDoubleClick(employee, "group")}>
                {editingEmployee && editingEmployee.id === employee.id && editingEmployee.fieldToEdit === "group" ? (
                  <input
                    type="text"
                    name="group"
                    value={editingEmployee.group}
                    onChange={(e) =>
                      setEditingEmployee((prev) => ({ ...prev, group: e.target.value }))
                    }
                    onBlur={handleUpdateEmployee}
                    onKeyDown={(e) => handleKeyDown(e, "group")}
                  />
                ) : (
                  employee.group
                )}
              </td>
              <td onDoubleClick={() => handleDoubleClick(employee, "name")}>
                {editingEmployee && editingEmployee.id === employee.id && editingEmployee.fieldToEdit === "name" ? (
                  <input
                    type="text"
                    name="name"
                    value={editingEmployee.name}
                    onChange={(e) =>
                      setEditingEmployee((prev) => ({ ...prev, name: e.target.value }))
                    }
                    onBlur={handleUpdateEmployee}
                    onKeyDown={(e) => handleKeyDown(e, "name")}
                  />
                ) : (
                  employee.name
                )}
              </td>
              <td onDoubleClick={() => handleDoubleClick(employee, "phone")}>
                {editingEmployee && editingEmployee.id === employee.id && editingEmployee.fieldToEdit === "phone" ? (
                  <input
                    type="text"
                    name="phone"
                    value={editingEmployee.phone}
                    onChange={(e) =>
                      setEditingEmployee((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    onBlur={handleUpdateEmployee}
                    onKeyDown={(e) => handleKeyDown(e, "phone")}
                  />
                ) : (
                  employee.phone
                )}
              </td>
              <td onDoubleClick={() => handleDoubleClick(employee, "sap")}>
                {editingEmployee && editingEmployee.id === employee.id && editingEmployee.fieldToEdit === "sap" ? (
                  <input
                    type="text"
                    name="sap"
                    value={editingEmployee.sap}
                    onChange={(e) =>
                      setEditingEmployee((prev) => ({ ...prev, sap: e.target.value }))
                    }
                    onBlur={handleUpdateEmployee}
                    onKeyDown={(e) => handleKeyDown(e, "sap")}
                  />
                ) : (
                  employee.sap
                )}
              </td>
              <td className="actions">
                {editingEmployee && editingEmployee.id === employee.id ? (
                  <button onClick={handleUpdateEmployee}>Save</button>
                ) : (
                  <button onClick={() => handleDoubleClick(employee, "name")}>Edit</button>
                )}
                <button onClick={() => handleDeleteEmployee(employee.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <label>Group</label>
              <input
                type="text"
                name="group"
                value={newEmployee.group}
                onChange={handleInputChange}
              />
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={newEmployee.name}
                onChange={handleInputChange}
              />
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={newEmployee.phone}
                onChange={handleInputChange}
              />
              <label>SAP</label>
              <input
                type="text"
                name="sap"
                value={newEmployee.sap}
                onChange={handleInputChange}
              />
              <button type="submit">Add Employee</button>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
