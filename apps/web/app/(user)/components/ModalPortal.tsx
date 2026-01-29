'use client'

import React from 'react'
import { createPortal } from 'react-dom'

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
    return createPortal(children, document.body)
};

export default ModalPortal;