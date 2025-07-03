import React from 'react'
import RecapForm from '@/features/result/components/resultForm'
import { Head } from '@inertiajs/react'
import AppWrapper from '@/components/layouts/app-wrapper'
import QuranHeader from '@/components/layouts/main-header'

const index = () => {
  return (
    <AppWrapper>
        <Head title='Recap'/>
        <QuranHeader
                page={1}
                translateMode="read"
                target="/result"
        />
        <div>
            <RecapForm/>
        </div>
    </AppWrapper>
  )
}

export default index
