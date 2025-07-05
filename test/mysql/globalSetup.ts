import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const outputFilePath = path.resolve(__dirname, './port.json')

export async function setup() {
  const ports: { mysql?: number } = {}
  try {
    const mysqlPortOutput = execSync(
      'docker compose port drizzle-plus-mysql 3306',
      { encoding: 'utf8' }
    ).trim()
    if (mysqlPortOutput) {
      ports.mysql = parseInt(mysqlPortOutput.split(':')[1], 10)
    }
    fs.writeFileSync(outputFilePath, JSON.stringify(ports, null, 2), 'utf8')
    console.log(`Extracted MySQL port to ${outputFilePath}`)
  } catch (e: any) {
    console.error(
      'Error extracting MySQL port. Ensure docker compose services are running:',
      e.message
    )
    process.exit(1)
  }
}

export async function teardown() {
  // Clean up the port.json file if it exists
  if (fs.existsSync(outputFilePath)) {
    fs.unlinkSync(outputFilePath)
    console.log(`Cleaned up ${outputFilePath}`)
  }
}
