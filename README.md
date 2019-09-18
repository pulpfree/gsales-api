# Gales Sales API Server Microserver

## Server update notes

The aws ecr docker image storage requires a login token, to get a fresh one, run:  
`$(aws ecr get-login --no-include-email)`

## Client update notes

go to 'src/client' and run:  
`./deploy/deploy.sh`