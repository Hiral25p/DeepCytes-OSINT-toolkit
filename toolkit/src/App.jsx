import React, { useState } from 'react'
import './App.css'
import logo from './assets/logo.png'
import secondarylogo from './assets/dclogo.png'
import jsPDF from 'jspdf' 
import 'jspdf-autotable' 



function App() {
  const [searchType, setSearchType] = useState('phoneNumber')
  const [inputValue, setInputValue] = useState('')
  const [output, setOutput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // function to format the output info into readable HTML
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




  // handle form submission, send data to backend and process the response
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

  const getPlaceholderText = () => {
    switch (searchType) {
      case 'phoneNumber':
        return 'e.g. +91 XXXXX-XXXXX'
      case 'instagram':
        return 'Instagram Username'
      case 'twitter':
        return 'Twitter Username'
      case 'github':
        return 'GitHub Username'
      case 'email':
        return 'e.g. example@gmail.com'
      default:
        return ''
    }
  }




  // converts image to base64 for pdf export
  const toBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = url
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const squareSize = Math.max(img.width, img.height)
        canvas.width = squareSize
        canvas.height = squareSize

        ctx.drawImage(
          img,
          (squareSize - img.width) / 2,
          (squareSize - img.height) / 2,
          img.width,
          img.height
        )

        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
      }
      img.onerror = (err) => {
        reject(err)
      }
    })
  }

  // downloading the  PDF report
  const downloadPDF = async () => {
    const doc = new jsPDF()

    const titles = {
      phoneNumber: 'Phone Number OSINT Report',
      instagram: 'Instagram OSINT Report',
      twitter: 'Twitter OSINT Report',
      github: 'GitHub OSINT Report',
      email: 'Email OSINT Report',
    }

    const reportTitle = titles[searchType] || 'DeepCytes OSINT Report'

    const imgData = await toBase64(secondarylogo)
    const imgSize = 26
    const pageWidth = doc.internal.pageSize.getWidth()
    const imgX = (pageWidth - imgSize) / 2
    const imgY = 8
    doc.addImage(imgData, 'PNG', imgX, imgY, imgSize, imgSize)

    const titleY = imgY + imgSize + 10
    doc.setFontSize(21)
    doc.text(reportTitle, pageWidth / 2, titleY, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.line(20, titleY + 2, pageWidth - 20, titleY + 2)

    let yOffset = titleY + 20

    const plainText = document.querySelector('.output-box').innerText
    const textLines = doc.splitTextToSize(plainText, pageWidth - 20)
    textLines.forEach((line) => {
      if (yOffset > 280) {
        doc.addPage()
        yOffset = 20
      }
      doc.setFontSize(11)
      doc.text(line, 10, yOffset)
      yOffset += 5
    })

    const filename = `DC-${
      searchType.charAt(0).toUpperCase() + searchType.slice(1)
    }-OSINTReport.pdf`
    doc.save(filename)
  }



  return (
    <div className={`container ${submitted ? 'expanded-container' : ''}`}>
      <img src={logo} alt='Logo' className='logo' />
      <form onSubmit={handleSubmit}>
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

        <input
          type='text'
          placeholder={getPlaceholderText()}
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

      {submitted && (
        <button className='download-btn' onClick={downloadPDF}>
          Download
        </button>
      )}
    </div>
  )
}

export default App
