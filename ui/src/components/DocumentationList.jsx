import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Link as LinkIcon, Trash2, Loader2, FileText, ExternalLink } from "lucide-react"

/**
 * Reusable Documentation List Component
 *
 * Props:
 * - documents: Array<{id, title, url, addedAt}>
 * - onAdd: (title, url) => void - Called when adding a new document
 * - onRemove: (docId) => void - Called when removing a document
 * - editable: boolean - Whether to show add/remove controls
 * - isAddPending: boolean - Loading state for add operation
 * - isRemovePending: boolean - Loading state for remove operation
 * - title: string - Card header title (default: "Documentation")
 * - emptyMessage: string - Message when no documents
 */
export default function DocumentationList({
  documents = [],
  onAdd,
  onRemove,
  editable = false,
  isAddPending = false,
  isRemovePending = false,
  title = "Documentation",
  emptyMessage = "No documentation added yet",
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, doc: null })
  const [form, setForm] = useState({ title: "", url: "" })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onAdd && form.title && form.url) {
      onAdd(form.title, form.url)
      setForm({ title: "", url: "" })
      setDialogOpen(false)
    }
  }

  const handleDelete = () => {
    if (onRemove && deleteDialog.doc) {
      onRemove(deleteDialog.doc.id)
      setDeleteDialog({ open: false, doc: null })
    }
  }

  // Normalize documents - handle both old format (object) and new format (array)
  const normalizedDocs = Array.isArray(documents) ? documents : []

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {editable && onAdd && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Doc
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Documentation</DialogTitle>
                  <DialogDescription>
                    Add a link to external documentation for this product.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="doc-title">Document Title</Label>
                    <Input
                      id="doc-title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Product Guide, Release Notes"
                      required
                      maxLength={200}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doc-url">URL</Label>
                    <Input
                      id="doc-url"
                      type="url"
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddPending}>
                    {isAddPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Document
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Documents List */}
      {normalizedDocs.length > 0 ? (
        <div className="space-y-2">
          {normalizedDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{doc.url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {editable && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    setDeleteDialog({ open: true, doc })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <LinkIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {editable && onAdd && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add your first document
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.doc?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemovePending}
            >
              {isRemovePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
