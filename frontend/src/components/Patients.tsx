import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, UserPlus, MoreVertical, X, Calendar, User, Edit, Trash2, Phone, MapPin, Shield, Pill, AlertTriangle, FileText, Accessibility, UserCheck, Sparkles } from "lucide-react";
import PatientDashboard from "./PatientDashboard";
import { ageFromDob } from "../lib/format";
import type { Patient, PatientInput } from "../types/patient";
import * as db from "../services/db";
import { SAMPLE_PATIENT } from "../services/sample";

type PatientFormData = PatientInput;

const EMPTY_FORM: PatientFormData = {
  name: "",
  gender: "Male",
  dob: "",
  address: "",
  phoneNumber: "",
  healthInsurance: "",
  chronicConditions: "",
  medications: "",
  allergies: "",
  disabilities: "",
  emergencyContact: "",
  emergencyPhone: ""
};

const Patients: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadPatients = useCallback(async () => {
    setPatients(await db.listPatients());
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const data: PatientFormData = { ...formData, name: formData.name.trim() };
    try {
      if (editingPatient) {
        await db.updatePatient(editingPatient.id, data);
      } else {
        await db.createPatient(data);
      }
      await loadPatients();
      handleCloseModal();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save patient.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
    setSaveError(null);
    setFormData(EMPTY_FORM);
  };

  const addSamplePatient = async () => {
    const p = await db.createPatient(SAMPLE_PATIENT);
    await loadPatients();
    setSelectedPatientId(p.id);
  };

  const toggleDropdown = (patientId: string) => {
    setOpenDropdownId(openDropdownId === patientId ? null : patientId);
  };

  const handleEditPatient = (patientId: string) => {
    const patientToEdit = patients.find(patient => patient.id === patientId);
    if (patientToEdit) {
      setEditingPatient(patientToEdit);
      setFormData({
        name: patientToEdit.name,
        gender: patientToEdit.gender,
        dob: patientToEdit.dob,
        address: patientToEdit.address,
        phoneNumber: patientToEdit.phoneNumber,
        healthInsurance: patientToEdit.healthInsurance,
        chronicConditions: patientToEdit.chronicConditions,
        medications: patientToEdit.medications,
        allergies: patientToEdit.allergies,
        disabilities: patientToEdit.disabilities,
        emergencyContact: patientToEdit.emergencyContact,
        emergencyPhone: patientToEdit.emergencyPhone,
      });
      setIsModalOpen(true);
    }
    setOpenDropdownId(null);
  };

  const handleDeletePatient = async (patientId: string) => {
    setOpenDropdownId(null);
    const p = patients.find(x => x.id === patientId);
    if (!window.confirm(`Delete ${p?.name ?? "this patient"} and all of their sessions? This cannot be undone.`)) return;
    await db.deletePatient(patientId);
    await loadPatients();
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

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
    loadPatients();
  };

  const q = search.trim().toLowerCase();
  const visiblePatients = q
    ? patients.filter(p =>
        [p.name, p.phoneNumber, p.healthInsurance, p.chronicConditions].some(v => v.toLowerCase().includes(q)))
    : patients;

  // If a patient is selected, show the patient dashboard
  if (selectedPatientId) {
    return (
      <PatientDashboard
        patientId={selectedPatientId}
        onBack={handleBackToPatients}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Stored only in this browser. {patients.length} patient{patients.length === 1 ? "" : "s"}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={addSamplePatient}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles size={18} />
            Add sample patient
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={20} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, insurance or condition..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Insurance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chronic Conditions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visiblePatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {patient.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">{(() => { const age = ageFromDob(patient.dob); return age !== null ? `${age} years` : "Age unknown"; })()}</div>
                      </div>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    {patient.gender}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    {patient.phoneNumber}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    {patient.healthInsurance}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <span className="block max-w-xs truncate">{patient.chronicConditions}</span>
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
                        <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 ring-1 ring-black ring-opacity-5">
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
          {loaded && visiblePatients.length === 0 && (
            <div className="p-8 text-center text-gray-600 space-y-2">
              {patients.length === 0 ? (
                <>
                  <p>No patients yet.</p>
                  <p className="text-sm text-gray-500">Add a patient, or add the fictional sample patient to try the visit-note flow.</p>
                </>
              ) : (
                <p>No patients match "{search}".</p>
              )}
            </div>
          )}
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
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPatient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
               {/* Personal Information Section */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                 
                 {/* Full Name */}
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

                 {/* Gender and DOB Row */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label htmlFor="gender" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <UserCheck size={16} />
                       Gender
                     </label>
                     <select
                       id="gender"
                       name="gender"
                       value={formData.gender}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       required
                     >
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                       <option value="Other">Other</option>
                     </select>
                   </div>

                   <div>
                     <label htmlFor="dob" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <Calendar size={16} />
                       Date of Birth
                     </label>
                     <input
                       type="date"
                       id="dob"
                       name="dob"
                       value={formData.dob}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       required
                     />
                   </div>

                 </div>
               </div>

               {/* Contact Information Section */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                 
                 {/* Address */}
                 <div>
                   <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <MapPin size={16} />
                     Address
                   </label>
                   <input
                     type="text"
                     id="address"
                     name="address"
                     value={formData.address}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                     placeholder="Enter full address (optional)"
                   />
                 </div>

                 {/* Phone Number */}
                 <div>
                   <label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <Phone size={16} />
                     Phone Number
                   </label>
                   <input
                     type="tel"
                     id="phoneNumber"
                     name="phoneNumber"
                     value={formData.phoneNumber}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                     placeholder="(123) 456-7890 (optional)"
                   />
                 </div>

                 {/* Emergency Contact Information */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label htmlFor="emergencyContact" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <UserCheck size={16} />
                       Emergency Contact
                     </label>
                     <input
                       type="text"
                       id="emergencyContact"
                       name="emergencyContact"
                       value={formData.emergencyContact}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       placeholder="Emergency contact name (optional)"
                     />
                   </div>

                   <div>
                     <label htmlFor="emergencyPhone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                       <Phone size={16} />
                       Emergency Phone
                     </label>
                     <input
                       type="tel"
                       id="emergencyPhone"
                       name="emergencyPhone"
                       value={formData.emergencyPhone}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                       placeholder="(123) 456-7890 (optional)"
                     />
                   </div>
                 </div>
               </div>

               {/* Medical Information Section */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Medical Information</h3>
                 
                 {/* Health Insurance */}
                 <div>
                   <label htmlFor="healthInsurance" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <Shield size={16} />
                     Health Insurance
                   </label>
                   <input
                     type="text"
                     id="healthInsurance"
                     name="healthInsurance"
                     value={formData.healthInsurance}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                     placeholder="Insurance provider (optional)"
                   />
                 </div>

                {/* Chronic Diseases */}
                <div>
                  <label htmlFor="chronicConditions" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText size={16} />
                    Chronic Conditions
                  </label>
                  <textarea
                    id="chronicConditions"
                    name="chronicConditions"
                    value={formData.chronicConditions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                    placeholder="List any chronic conditions (optional, separate with commas)"
                  />
                </div>

                 {/* Current Medications */}
                 <div>
                   <label htmlFor="medications" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <Pill size={16} />
                     Current Medications
                   </label>
                   <textarea
                     id="medications"
                     name="medications"
                     value={formData.medications}
                     onChange={handleInputChange}
                     rows={3}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                     placeholder="List current medications (optional, separate with commas)"
                   />
                 </div>

                 {/* Allergies */}
                 <div>
                   <label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <AlertTriangle size={16} />
                     Allergies
                   </label>
                   <textarea
                     id="allergies"
                     name="allergies"
                     value={formData.allergies}
                     onChange={handleInputChange}
                     rows={2}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                     placeholder="List any allergies (optional, separate with commas)"
                   />
                 </div>

                 {/* Disabilities */}
                 <div>
                   <label htmlFor="disabilities" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                     <Accessibility size={16} />
                     Disabilities/Special Needs
                   </label>
                   <textarea
                     id="disabilities"
                     name="disabilities"
                     value={formData.disabilities}
                     onChange={handleInputChange}
                     rows={2}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                     placeholder="List any disabilities or special needs (optional)"
                   />
                 </div>
               </div>

              {saveError && <p className="text-sm text-red-600" role="alert">{saveError}</p>}
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
                   {editingPatient ? 'Update Patient' : 'Add Patient'}
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
