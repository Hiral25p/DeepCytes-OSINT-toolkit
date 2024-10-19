import React, { useState } from 'react'
import './App.css'
import logo from './assets/logo.png'

function App() {
  const [searchType, setSearchType] = useState('phoneNumber') // Dropdown value
  const [inputValue, setInputValue] = useState('') // Single input box value
  const [output, setOutput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const formatOutput = (info) => {
    if (!info) return '<p>No information available.</p>'
    const formattedInfo = []

    const formatNestedObject = (obj) => {
      return Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `<p><strong>${key}:</strong></p>${formatNestedObject(value)}`
          }
          return `<p><strong>${key}:</strong> ${
            value !== null ? value : 'N/A'
          }</p>`
        })
        .join('')
    }

    for (const [key, value] of Object.entries(info)) {
      if (typeof value === 'object' && value !== null) {
        formattedInfo.push(
          `<p><strong>${key}:</strong></p>${formatNestedObject(value)}`
        )
      } else {
        formattedInfo.push(
          `<p><strong>${key}:</strong> ${value !== null ? value : 'N/A'}</p>`
        )
      }
    }

    return formattedInfo.join('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const dataToSend = { [searchType]: inputValue || null }

    try {
      const response = await fetch('http://127.0.0.1:5000/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      const inputInfo = `
        <div class="input-info">
          <h4><strong>Provided Information:</strong></h4>
          ${inputValue ? `<p>${searchType}: ${inputValue}</p>` : ''}
          <br/><br/>
        </div>
      `

      setOutput(`
        ${inputInfo}
        <div class="info-section">
          <h3><u>Relevant Information:</u></h3>
          <div>${formatOutput(data.relevant_info)}</div>
        </div>
        <div class="info-section">
          <h3><u>All Available Information:</u></h3>
          <div>${formatOutput(data.other_info)}</div>
        </div>
        <div class="result-summary">
          <p>*Results gathered from <strong>${
            data.tool_count || 'multiple'
          }</strong> sources</p>
        </div>
      `)

      setInputValue('')
      setSubmitted(true)
    } catch (error) {
      setOutput(
        '<p>There was an error fetching the data. Please try again.</p>'
      )
    }
  }

  const handleFieldChange = (e) => {
    setInputValue(e.target.value)
    setOutput('')
    setSubmitted(false)
  }

  return (
    <div className='container'>
      <img src={logo} alt='Logo' className='logo' />
      {/* <h2>DeepCytes OSINT Toolkit</h2> */}
      <form onSubmit={handleSubmit}>
        {/* Dropdown for search type */}
        <select
          className='input-box'
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value='phoneNumber'>Phone Number</option>
          <option value='instagram'>Instagram</option>
          <option value='twitter'>Twitter</option>
          <option value='github'>GitHub</option>
          <option value='email'>Email</option>
        </select>

        {/* Input box for the user */}
        <input
          type='text'
          placeholder={`Enter ${
            searchType.charAt(0).toUpperCase() + searchType.slice(1)
          }`}
          value={inputValue}
          onChange={handleFieldChange}
          className={`input-box ${submitted ? '' : ''}`}
        />

        <button type='submit' className='submit-btn'>
          Search
        </button>
      </form>

      {output && (
        <div
          className='output-box'
          dangerouslySetInnerHTML={{ __html: output }}
        />
      )}
    </div>
  )
}

export default App
