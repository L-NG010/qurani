import React from 'react'
import RecapForm from '@/features/result/components/resultForm'
import { Head } from '@inertiajs/react'
import AppWrapper from '@/components/layouts/app-wrapper'
import QuranHeader from '@/components/layouts/main-header'
import DisabledRecapFormLayout from '@/features/recap/Index'
import RecapHeader from '@/components/layouts/recap-header'

const index = () => {
  return (
    <AppWrapper>
        <Head title='Recap'/>
        <RecapHeader
                page={1}
                translateMode="read"
                classNav=""
                target=""
        />
        <div>
            <DisabledRecapFormLayout/>
        </div>
    </AppWrapper>
  )
}

export default index
