import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react'
import { Button } from "@heroui/react"
import toast from 'react-hot-toast'
import { useDarkMode } from '../../hooks/theme/useDarkMode'
import { useHotkeys } from 'react-hotkeys-hook'
import { useState } from 'react'

const DropzoneUpload = ({
  onUpload,
  acceptedTypes = { 'text/csv': [] },
  maxFiles = 1,
  fullScreen = false,
  children,
}) => {
  const [darkMode] = useDarkMode()
  const [isDragCancelled, setIsDragCancelled] = useState(false)

  const imgFolder = darkMode ? 'dark' : 'light'

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (onUpload) {
        // Use FileReader to read each file as text
        acceptedFiles.forEach((file) => {
          const fileName = file?.name
          const reader = new FileReader()
          reader.onload = (event) => {
            const fileContent = event.target.result
            // Do something with the file content, e.g., pass it to the onUpload callback
            onUpload({ fileName, fileContent })
          }
          reader.onerror = () => {
            toast.error('Failed to read the file content')
          }
          reader.readAsText(file) // Ensure the file is passed as a Blob
        })
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: maxFiles,
    onDrop,
    accept: acceptedTypes,
    onDropRejected: (errors) => {
      const errorCode = errors[0]?.errors[0]?.code

      if (errorCode === 'file-too-large') {
        toast.error('File size is too large.')
      } else if (errorCode === 'too-many-files') {
        toast.error(
          `You can only upload ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`
        )
      } else if (errorCode === 'file-invalid-type') {
        toast.error(
          `The file type you are trying to upload is not supported. Supported file types are: ${
            acceptedTypes ? Object?.keys(acceptedTypes)?.join(', ') : 'CSV'
          }`
        )
      }
    },
  })

  useHotkeys('esc', () => setIsDragCancelled(true), {
    enableOnTags: ['INPUT', 'TEXTAREA'],
  })

  const activeClass =
    isDragActive && !isDragCancelled
      ? 'z-10 bg-secondary-200/90'
      : 'bg-transparent'

  if (fullScreen) {
    return (
      <div {...getRootProps()}>
        {isDragActive && !isDragCancelled && (
          <div
            className={`w-screen h-screen fixed top-0 left-0 flex items-center justify-center ${activeClass}`}
          >
            <p className="font-semibold text-4xl">
              Drop it like it&apos;s hot!
            </p>
          </div>
        )}
        {children}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`min-h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-default-200 rounded-lg p-6 cursor-pointer hover:bg-content2 ${
        isDragActive ? 'bg-primary-200' : 'bg-content1'
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="font-semibold text-lg">Drop it like it&apos;s hot!</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <img
              src={`/empty-states/${imgFolder}/upload.svg`}
              alt="upload"
              className="w-24 h-24 mx-auto"
            />
            <p className="font-medium text-default-500">
              Drag & drop some files here
            </p>
          </div>
          <Button color="primary" variant="light">
            Select Files
          </Button>
        </div>
      )}
    </div>
  )
}

export default DropzoneUpload
