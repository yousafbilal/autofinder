import React from 'react'
import Header from './include/Header'
import Footer from './include/Footer'

function Base({ children }) {

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header />
            {children}
            <Footer />
        </div>
    )
}

export default Base