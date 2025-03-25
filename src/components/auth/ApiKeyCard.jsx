import {
  Button,
  Card,
  CardBody,
  Code,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@heroui/react"
import { useState } from 'react'
import {
  RiFileCopyLine,
  RiEyeLine,
  RiEyeOffLine,
  RiDeleteBin6Line,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useDeleteApiKey } from '../../hooks/react-query/api-keys/useApiKeys'
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace'

function ApiKeyCard({ apiKey }) {
  const [currentWorkspace] = useCurrentWorkspace()
  const { onOpen, isOpen, onOpenChange, onClose } = useDisclosure()
  const { mutateAsync: deleteApiKey, isPending: isDeleting } =
    useDeleteApiKey(currentWorkspace)
  const [revealedKey, setRevealedKey] = useState(false)

  const toggleRevealKey = () => {
    setRevealedKey(!revealedKey)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key)
      toast.success('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy key:', err)
    }
  }

  const handleDelete = async () => {
    await deleteApiKey(
      { id: apiKey.id },
      {
        onSuccess: () => {
          toast('API key deleted')
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
    onClose()
  }

  return (
    <>
      <Card shadow="sm">
        <CardBody className="flex flex-col gap-3 font-medium">
          {apiKey.name}
          <div className="w-full flex flex-wrap gap-3 items-center">
            <Code size="lg" className="basis-3/6 grow shrink overflow-hidden">
              {revealedKey ? apiKey.key : '•'.repeat(apiKey.key.length)}
            </Code>
            <div className="flex gap-1">
              <Tooltip content="Copy">
                <Button
                  variant="light"
                  size="md"
                  isIconOnly
                  onClick={copyToClipboard}
                >
                  <RiFileCopyLine className="text-lg" />
                </Button>
              </Tooltip>
              <Tooltip content={revealedKey ? 'Hide key' : 'Reveal key'}>
                <Button
                  variant="light"
                  size="md"
                  isIconOnly
                  onClick={toggleRevealKey}
                >
                  {revealedKey ? (
                    <RiEyeOffLine className="text-lg" />
                  ) : (
                    <RiEyeLine className="text-lg" />
                  )}
                </Button>
              </Tooltip>
              <Tooltip content="Delete">
                <Button
                  color="danger"
                  variant="light"
                  size="md"
                  isIconOnly
                  onClick={onOpen}
                >
                  <RiDeleteBin6Line className="text-lg" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardBody>
      </Card>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Delete API key</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to revoke API key{' '}
              <span className="font-bold">{apiKey.name}</span>? All future
              requests made using this key will fail.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              isDisabled={isDeleting}
              onPress={onClose}
            >
              Close
            </Button>
            <Button
              color="danger"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Yes, delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ApiKeyCard
