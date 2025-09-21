import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, UserPlus, MoreVertical, X, Calendar, User, Stethoscope, Activity, Edit, Trash2 } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  status: "Active" | "Recovered" | "Critical";
  lastVisit: string;
  doctor: string;
}

interface PatientFormData {
  name: string;
  age: string;
  condition: string;
  status: "Active" | "Recovered" | "Critical";
  lastVisit: string;
  doctor: string;
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: "1",
      name: "John Smith",
      age: 45,
      condition: "Hypertension",
      status: "Active",
      lastVisit: "2024-01-15",
      doctor: "Dr. Johnson"
    },
    {
      id: "2",
      name: "Sarah Wilson",
      age: 32,
      condition: "Diabetes",
      status: "Recovered",
      lastVisit: "2024-01-10",
      doctor: "Dr. Brown"
    },
    {
      id: "3",
      name: "Michael Davis",
      age: 58,
      condition: "Heart Disease",
      status: "Critical",
      lastVisit: "2024-01-18",
      doctor: "Dr. Johnson"
    },
    {
      id: "4",
      name: "Emily Johnson",
      age: 28,
      condition: "Asthma",
      status: "Active",
      lastVisit: "2024-01-12",
      doctor: "Dr. Smith"
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    age: "",
    condition: "",
    status: "Active",
    lastVisit: "",
    doctor: ""
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "Recovered":
        return "bg-green-100 text-green-800";
      case "Critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a new ID
    const newId = (patients.length + 1).toString();
    
    // Create new patient
    const newPatient: Patient = {
      id: newId,
      name: formData.name,
      age: parseInt(formData.age),
      condition: formData.condition,
      status: formData.status,
      lastVisit: formData.lastVisit,
      doctor: formData.doctor
    };

    // Add to patients list
    setPatients(prev => [...prev, newPatient]);

    // Reset form and close modal
    setFormData({
      name: "",
      age: "",
      condition: "",
      status: "Active",
      lastVisit: "",
      doctor: ""
    });
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      age: "",
      condition: "",
      status: "Active",
      lastVisit: "",
      doctor: ""
    });
  };

  const toggleDropdown = (patientId: string) => {
    setOpenDropdownId(openDropdownId === patientId ? null : patientId);
  };

  const handleEditPatient = (patientId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit patient:", patientId);
    setOpenDropdownId(null);
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== patientId));
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage and monitor patient information</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus size={20} />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} />
            Filter
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.condition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(patient.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.doctor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                    <div className="relative" ref={openDropdownId === patient.id ? dropdownRef : null}>
                      <button 
                        onClick={() => toggleDropdown(patient.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openDropdownId === patient.id && (
                        <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => handleEditPatient(patient.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Popup */}
      {isModalOpen && (
         <div 
           className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-50"
           onClick={handleCloseModal}
         >
          <div 
            className="bg-white rounded-lg w-[90%] max-w-6xl max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Patient</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div className="space-y-6">
                 {/* Name - Full Width */}
                 <div>
                   <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <User size={16} />
                     Full Name
                   </label>
                   <input
                     type="text"
                     id="name"
                     name="name"
                     value={formData.name}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                     placeholder="Enter patient's full name"
                     required
                   />
                 </div>
 
                 {/* Age, Status, and Condition Row */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label htmlFor="age" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <Calendar size={16} />
                       Age
                     </label>
                     <input
                       type="number"
                       id="age"
                       name="age"
                       value={formData.age}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       placeholder="Age"
                       min="0"
                       max="150"
                       required
                     />
                   </div>
 
                   <div>
                     <label htmlFor="status" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <Activity size={16} />
                       Status
                     </label>
                     <select
                       id="status"
                       name="status"
                       value={formData.status}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       required
                     >
                       <option value="Active">Active</option>
                       <option value="Recovered">Recovered</option>
                       <option value="Critical">Critical</option>
                     </select>
                   </div>

                   <div>
                     <label htmlFor="condition" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <Stethoscope size={16} />
                       Condition
                     </label>
                     <input
                       type="text"
                       id="condition"
                       name="condition"
                       value={formData.condition}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       placeholder="Enter medical condition"
                       required
                     />
                   </div>
                 </div>
 
                 {/* Visit Date and Doctor Row */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label htmlFor="lastVisit" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <Calendar size={16} />
                       Visit Date
                     </label>
                     <input
                       type="date"
                       id="lastVisit"
                       name="lastVisit"
                       value={formData.lastVisit}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       required
                     />
                   </div>
 
                   <div>
                     <label htmlFor="doctor" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <User size={16} />
                       Doctor Assigned
                     </label>
                     <input
                       type="text"
                       id="doctor"
                       name="doctor"
                       value={formData.doctor}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       placeholder="Enter assigned doctor's name"
                       required
                     />
                   </div>
                 </div>
               </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
