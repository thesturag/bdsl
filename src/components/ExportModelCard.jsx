import React from 'react'
import {Card, Button} from "keep-react"

const ExportModelCard = ({handleExportModel,classNames,model,downloadPath,metadatFileName}) => {
  return (
     <Card className="max-w-md">
        <Card.Content className="space-y-6">
          <Card.Title>
            <h2 className="card-title">Export Trained Model</h2>
            <div id="dropdown-menu-holder" role="menu">
              <div
                id="dropdown-menu"
                className="open"
                style={{ top: "128px", left: "396px" }}
              >
                <slot aria-hidden="false"></slot>
              </div>
            </div>
          </Card.Title>
          <Card.Description>
            <Button
              size="sm"
              className="btn btn-success"
              onClick={async() => await handleExportModel(classNames,model,downloadPath,metadatFileName)}
            >
              Export Model
            </Button>
          </Card.Description>
          <Card.Footer>
            <p>
              You must train your model before you try to export your
              model
            </p>
          </Card.Footer>
        </Card.Content>
      </Card>
  )
}

export default ExportModelCard