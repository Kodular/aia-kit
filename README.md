# aia-kit

![npm](https://img.shields.io/npm/v/aia-kit)

Read, Parse, Edit, Write AIA/AIX/AIS files.

## Installation

```bash
npm install aia-kit
```

## Usage

```javascript
import { AIAReader } from 'aia-kit'

const aiaFile = await fs.readFile('test/fixtures/Test.aia')
const aiaFileBlob = new Blob([aiaFile])

const project = await AIAReader.read(aiaFileBlob)

expect(project).toBeDefined()

expect(project.name).toBe('Test')

expect(project.screens.length).toBe(1)
expect(project.screens[0].name).toBe('Screen1')
```
_Code taken from `test/aia.test.js`_

---

Copyright (c) 2023 Junnovate, LLC
