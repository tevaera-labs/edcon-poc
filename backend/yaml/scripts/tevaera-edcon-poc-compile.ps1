param(
  [parameter( Mandatory = $true )]
  [string]$workingDirectory,

  [parameter( Mandatory = $true )]
  [string]$outputDirectory
)

# move to working directory
cd $workingDirectory

# install dependencies
Write-Output "* installing dependencies"
yarn install
if ($lastexitcode -ne 0) {
  throw 'error executing yarn install'
}

# run TS transpile
Write-Output "* transpiling typescript code"
yarn build:tsc
if ($lastexitcode -ne 0) {
  throw 'error executing yarn build:tsc'
}

Write-Output "*** DONE! ***"
