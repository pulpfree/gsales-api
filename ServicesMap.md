# Gales Sales Services Map

## API Lambda Functions

| Directory | CloudFormation Stack name | Description |
| :------ | :--- | :--- | :--------- |
| Sites/Gales/sales/server | gsales-api-prod | Sales API production lambda |
| Sites/Gales/sales/server | gsales-api-stage | Sales API staging lambda |

---

## Golang Services Lambda Functions

| Directory | CloudFormation Stack name | Require Upgrade | Description |
| :------ | :--- | :--- | :--------- |
| gsales-fs-export | gsales-fs-export | N | Lambda Service to extract fuel and propane sales from gales-sales app - updated version from gales-fuelsale-export - used by the Dips app, not from the Sales app |
| gsales-pdf-reports | gsales-pdf-reports | Y |  |
| gsales-xls-reports | gsales-xls-reports | Y |  |
