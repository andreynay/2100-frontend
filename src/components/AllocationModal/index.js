import React, { useState, useEffect, useMemo } from 'react'
import { useStoreContext } from '../../contexts/Store'
import { Modal, Button } from 'react-bootstrap'
import AllocateMultiple from '../AllocateMultiple'

import './style.scss'

function Hesitate({onCancel, onDiscard}){
  return (
    <React.Fragment>
    <Modal.Header>
      <Modal.Title>
        Done?
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Discarding your message can't be undone. You'll lose your message
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onCancel} variant="secondary">Cancel</Button><Button onClick={onDiscard} variant="danger">Discard</Button>
    </Modal.Footer>
    </React.Fragment>
  )
}

export default function AllocationModal(){
  const [showHesitate, setShowHesitate] = useState(false)
  const [close, setClose] = useState(false)

  const { query } = useStoreContext()
  let isEditing = query.getIsEditingAllocations()
  const isSignedIn = query.getIsSignedIn()
  let editingTokenId = isEditing&&isEditing.tokenid

  useEffect( () => {
    if (!close) return
    query.setIsEditing({})
    setClose(false)
    setShowHesitate(false)
  }, [close])

  function onHide(){
    if (query.getIsAllocating()) return
    query.setIsEditing({})
  }

  return (
    <Modal
      show={Boolean(editingTokenId)}
      onHide={onHide}
      aria-labelledby='contained-modal-title-vcenter'
      centered
      animation={false}
      backdrop={true}
      backdropClassName={'allocate-backdrop'}
      size='lg'
    >
      {!showHesitate && (
        <Modal.Header closeButton>
          <div className='row justify-content-center align-items-center'>
            <div className='col-md-4 pt-2 pb-2'>
                <img className='staking-breakdown' src='/img/staking-breakdown3.png' />
            </div>
            <div className='col-md-7'>
              <h5>Earning Rewards</h5>
              <p className='small'>Rewards are generated for each 2100 asset about once per minute. Attach your DAI to assets to earn a part of the reward.</p>
            </div>
          </div>
        </Modal.Header>
      )}
      <div style={{display: showHesitate ? 'none' : 'block'}}>
         <AllocateMultiple />
      </div>
      {showHesitate && <Hesitate onCancel={()=>setShowHesitate(false)} onDiscard={()=>setClose(true)} /> }
    </Modal>
  )
}