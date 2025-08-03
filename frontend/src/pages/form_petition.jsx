import React, { useState } from 'react';

function FormPetition() {
  const [formData, setFormData] = useState({
    department_from: '',
    department_to: ''
  });

  const [petitionText, setPetitionText] = useState('');
  const [petitionList, setPetitionList] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPetition = () => {
    if (petitionText.trim() === '') {
      alert('Please enter a petition text.');
      return;
    }
    setPetitionList(prevList => [...prevList, petitionText.trim()]);
    setPetitionText('');
  };

  const handleSubmit = () => {
    if (
      formData.department_from.trim() === '' ||
      formData.department_to.trim() === '' ||
      petitionList.length === 0
    ) {
      alert('Please fill all fields and add at least one petition.');
      return;
    }

    const dataToSend = {
      ...formData,
      petitions: petitionList
    };

    // Replace this with your real API
    fetch('https://your-api.com/submit-petition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
      .then(res => {
        if (res.ok) {
          alert('Submitted successfully!');
          setFormData({ department_from: '', department_to: '' });
          setPetitionList([]);
        } else {
          alert('Submission failed.');
        }
      })
      .catch(err => {
        alert('Error: ' + err.message);
      });
  };

  return (
    <div>
      <h2>Petition Form</h2>

      <input
        name="department_from"
        value={formData.department_from}
        onChange={handleChange}
        placeholder="From Department"
      /><br />

      <input
        name="department_to"
        value={formData.department_to}
        onChange={handleChange}
        placeholder="To Department"
      /><br />

      <input
        value={petitionText}
        onChange={(e) => setPetitionText(e.target.value)}
        placeholder="Petition text"
      />
      <button onClick={handleAddPetition}>Add Petition</button>

      <h4>Petitions:</h4>
      <ul>
        {petitionList.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>

      <button onClick={handleSubmit} disabled={petitionList.length === 0}>
        Submit All
      </button>
    </div>
  );
}

export default FormPetition;
