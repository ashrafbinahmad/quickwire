// Basic tests without parameters
export const getTest = async () => {
  return "test"
}

// Tests with simple parameters
export const twoParamTest = async (a: string, b: string) => {
  return a + b
}

// Tests with object parameters
export const objTest = async (params: {a: string, b: string, c: string}) => {
  const {a, b, c} = params
  return a + b + c
}

// Tests with arrays
export const arrayTest = async (items: string[]) => {
  return items.join(", ")
}

export const createMultipleItems = async (params: {names: string[], tags: string[]}) => {
  return {
    created: params.names.length,
    items: params.names.map((name, index) => ({
      name,
      tag: params.tags[index] || 'default'
    }))
  }
}

// Tests with file uploads
export const uploadSingleFile = async (file: File) => {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  }
}

export const uploadMultipleFiles = async (files: File[]) => {
  return {
    count: files.length,
    files: files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }))
  }
}

export const uploadWithMetadata = async (params: {file: File, title: string, description?: string}) => {
  return {
    upload: {
      fileName: params.file.name,
      fileSize: params.file.size,
      title: params.title,
      description: params.description || 'No description provided'
    }
  }
}

export const uploadComplexData = async (params: {
  files: File[],
  metadata: {
    title: string,
    tags: string[],
    isPublic: boolean
  },
  author: string
}) => {
  return {
    uploadedFiles: params.files.map(file => file.name),
    metadata: params.metadata,
    author: params.author,
    uploadedAt: new Date().toISOString()
  }
}

// Tests with optional parameters
export const optionalParamTest = async (required: string, optional?: string) => {
  return {
    required,
    optional: optional || 'default value',
    hasOptional: !!optional
  }
}

export const mixedOptionalTest = async (params: {
  name: string,
  age?: number,
  tags?: string[],
  metadata?: {
    created: string,
    updated?: string
  }
}) => {
  return {
    profile: {
      name: params.name,
      age: params.age || 0,
      tags: params.tags || [],
      metadata: {
        created: params.metadata?.created || new Date().toISOString(),
        updated: params.metadata?.updated
      }
    }
  }
}

// Tests with different HTTP methods based on naming
export const listTests = async () => {
  return [
    { id: 1, name: 'Test 1' },
    { id: 2, name: 'Test 2' },
    { id: 3, name: 'Test 3' }
  ]
}

export const findTestById = async (id: string) => {
  return {
    id: parseInt(id),
    name: `Test ${id}`,
    found: true
  }
}

// PUT method tests (update, edit, modify, change, set, put, replace, toggle, etc.)
export const updateTestData = async (params: {id: string, name: string, description?: string}) => {
  return {
    id: parseInt(params.id),
    name: params.name,
    description: params.description,
    updated: true,
    updatedAt: new Date().toISOString()
  }
}

export const editUserProfile = async (params: {userId: string, profile: {name: string, email: string, bio?: string}}) => {
  return {
    userId: params.userId,
    profile: params.profile,
    method: 'PUT',
    action: 'edit',
    updatedAt: new Date().toISOString()
  }
}

export const modifySettings = async (params: {settingId: string, value: string | number | boolean}) => {
  return {
    settingId: params.settingId,
    newValue: params.value,
    method: 'PUT',
    action: 'modify',
    modifiedAt: new Date().toISOString()
  }
}

export const changePassword = async (params: {userId: string, oldPassword: string, newPassword: string}) => {
  return {
    userId: params.userId,
    method: 'PUT',
    action: 'change',
    passwordChanged: true,
    changedAt: new Date().toISOString()
  }
}

export const setConfiguration = async (params: {configKey: string, configValue: Record<string, unknown>}) => {
  return {
    configKey: params.configKey,
    configValue: params.configValue,
    method: 'PUT',
    action: 'set',
    setAt: new Date().toISOString()
  }
}

export const replaceDocument = async (params: {documentId: string, content: string, metadata?: Record<string, unknown>}) => {
  return {
    documentId: params.documentId,
    contentLength: params.content.length,
    metadata: params.metadata,
    method: 'PUT',
    action: 'replace',
    replacedAt: new Date().toISOString()
  }
}

export const toggleFeature = async (params: {featureId: string, enabled: boolean}) => {
  return {
    featureId: params.featureId,
    enabled: params.enabled,
    method: 'PUT',
    action: 'toggle',
    toggledAt: new Date().toISOString()
  }
}

// PATCH method tests (patch, partial, increment, decrement, append, prepend, adjust, tweak)
export const patchUserData = async (params: {userId: string, updates: Record<string, unknown>}) => {
  return {
    userId: params.userId,
    updates: params.updates,
    method: 'PATCH',
    action: 'patch',
    patchedAt: new Date().toISOString()
  }
}

export const partialUpdate = async (params: {resourceId: string, partialData: Record<string, unknown>}) => {
  return {
    resourceId: params.resourceId,
    partialData: params.partialData,
    method: 'PATCH',
    action: 'partial',
    partiallyUpdatedAt: new Date().toISOString()
  }
}

export const incrementCounter = async (params: {counterId: string, incrementBy?: number}) => {
  return {
    counterId: params.counterId,
    incrementBy: params.incrementBy || 1,
    method: 'PATCH',
    action: 'increment',
    incrementedAt: new Date().toISOString()
  }
}

export const decrementScore = async (params: {scoreId: string, decrementBy?: number}) => {
  return {
    scoreId: params.scoreId,
    decrementBy: params.decrementBy || 1,
    method: 'PATCH',
    action: 'decrement',
    decrementedAt: new Date().toISOString()
  }
}

export const appendToList = async (params: {listId: string, items: string[]}) => {
  return {
    listId: params.listId,
    appendedItems: params.items,
    itemsAdded: params.items.length,
    method: 'PATCH',
    action: 'append',
    appendedAt: new Date().toISOString()
  }
}

export const prependToQueue = async (params: {queueId: string, items: string[]}) => {
  return {
    queueId: params.queueId,
    prependedItems: params.items,
    itemsAdded: params.items.length,
    method: 'PATCH',
    action: 'prepend',
    prependedAt: new Date().toISOString()
  }
}

export const adjustVolume = async (params: {deviceId: string, volumeLevel: number}) => {
  return {
    deviceId: params.deviceId,
    volumeLevel: params.volumeLevel,
    method: 'PATCH',
    action: 'adjust',
    adjustedAt: new Date().toISOString()
  }
}

export const tweakSettings = async (params: {settingsId: string, tweaks: Record<string, unknown>}) => {
  return {
    settingsId: params.settingsId,
    tweaks: params.tweaks,
    method: 'PATCH',
    action: 'tweak',
    tweakedAt: new Date().toISOString()
  }
}

// DELETE method test
export const deleteTestItem = async (id: string) => {
  return {
    id: parseInt(id),
    deleted: true,
    deletedAt: new Date().toISOString()
  }
}

// Tests with complex nested objects
export const complexObjectTest = async (params: {
  user: {
    id: string,
    profile: {
      name: string,
      email: string,
      preferences: {
        theme: 'light' | 'dark',
        notifications: boolean,
        languages: string[]
      }
    }
  },
  settings: {
    privacy: {
      publicProfile: boolean,
      showEmail: boolean
    },
    features: string[]
  }
}) => {
  return {
    processed: true,
    user: params.user,
    settings: params.settings,
    processedAt: new Date().toISOString()
  }
}

// Tests with primitive types
export const primitiveTypesTest = async (params: {
  stringValue: string,
  numberValue: number,
  booleanValue: boolean,
  dateValue: string,
  optionalString?: string,
  optionalNumber?: number
}) => {
  return {
    received: {
      string: typeof params.stringValue,
      number: typeof params.numberValue,
      boolean: typeof params.booleanValue,
      date: params.dateValue,
      hasOptionalString: !!params.optionalString,
      hasOptionalNumber: !!params.optionalNumber
    },
    values: params
  }
}