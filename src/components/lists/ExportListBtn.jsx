import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react"
import {
  PiPaperPlaneTiltDuotone,
  PiShieldCheckDuotone,
  PiWarningDiamondDuotone,
} from 'react-icons/pi'
import toast from 'react-hot-toast'
import ky from 'ky'

function ExportListBtn({
  list,
  variant = 'ghost',
  size = 'sm',
  color = 'secondary',
}) {
  const downloadCsv = async (listId, listName, filters, type) => {
    try {
      const res = await ky.get(`/api/list/export/${listId}`, {
        headers: {
          'x-filters': JSON.stringify(filters),
        },
      })

      // Ensure the response is a blob
      const blob = await res.blob()

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Set a meaningful filename
      link.download = `${listName}_${type}_mailerfuse.csv`

      // Trigger the download
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading CSV:', error)
      toast('Error downloading CSV', {
        type: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <Dropdown backdrop="blur">
      <DropdownTrigger>
        <Button variant={variant} color={color} size={size}>
          Export
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem
          key="max-reach"
          description="Deliverable, risky and unknown emails"
          startContent={
            <PiPaperPlaneTiltDuotone className="text-2xl text-blue-500" />
          }
          onClick={() =>
            downloadCsv(
              list?.id,
              list?.name,
              ['deliverable', 'risky', 'unknown'],
              'max-reach'
            )
          }
        >
          Max Reach
        </DropdownItem>
        <DropdownItem
          key="deliverable"
          description="Deliverable emails only"
          startContent={
            <PiShieldCheckDuotone className="text-2xl text-success" />
          }
          onClick={() =>
            downloadCsv(list?.id, list?.name, ['deliverable'], 'deliverable')
          }
        >
          Deliverable only
        </DropdownItem>
        <DropdownItem
          key="bad"
          description="Undeliverable emails only"
          startContent={
            <PiWarningDiamondDuotone className="text-2xl text-warning" />
          }
          onClick={() =>
            downloadCsv(
              list?.id,
              list?.name,
              ['undeliverable'],
              'undeliverable'
            )
          }
        >
          Invalid Emails
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export default ExportListBtn
