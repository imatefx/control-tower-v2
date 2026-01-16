import { forwardRef } from "react"
import {
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  Clock,
  Shield,
  Gauge,
  FileText,
  Calendar,
  Package,
  Tag
} from "lucide-react"

const itemTypeConfig = {
  feature: { icon: Sparkles, label: "Feature", bgColor: "bg-emerald-100", textColor: "text-emerald-700", borderColor: "border-emerald-300" },
  bugfix: { icon: Bug, label: "Bug Fix", bgColor: "bg-red-100", textColor: "text-red-700", borderColor: "border-red-300" },
  improvement: { icon: Zap, label: "Improvement", bgColor: "bg-blue-100", textColor: "text-blue-700", borderColor: "border-blue-300" },
  breaking: { icon: AlertTriangle, label: "Breaking Change", bgColor: "bg-amber-100", textColor: "text-amber-700", borderColor: "border-amber-300" },
  deprecation: { icon: Clock, label: "Deprecation", bgColor: "bg-slate-100", textColor: "text-slate-700", borderColor: "border-slate-300" },
  deprecated: { icon: Clock, label: "Deprecated", bgColor: "bg-slate-100", textColor: "text-slate-700", borderColor: "border-slate-300" },
  security: { icon: Shield, label: "Security", bgColor: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  performance: { icon: Gauge, label: "Performance", bgColor: "bg-cyan-100", textColor: "text-cyan-700", borderColor: "border-cyan-300" },
  docs: { icon: FileText, label: "Documentation", bgColor: "bg-indigo-100", textColor: "text-indigo-700", borderColor: "border-indigo-300" },
}

const headerStyles = {
  gradient: "bg-gradient-to-r",
  clean: "bg-white border-b-4",
  technical: "bg-slate-900 text-white"
}

const ReleaseNotePreview = forwardRef(({ releaseNote, template, product, className = "" }, ref) => {
  if (!releaseNote || !template) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No release note data available
      </div>
    )
  }

  const { sections = [], styling = {} } = template
  const {
    primaryColor = "#1e40af",
    secondaryColor = "#3b82f6",
    showItemIcons = true,
    showVersion = true,
    showDate = true,
    showProductName = true,
    showClient = false,
    showEnvironment = false,
    fontFamily = "system-ui",
    headerStyle = "gradient"
  } = styling

  // Group items by type
  const itemsByType = (releaseNote.items || []).reduce((acc, item) => {
    const type = item.type || "feature"
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {})

  // Render header based on style
  // Note: Using fixed colors since this is a PDF preview with white background
  const renderHeader = () => {
    const headerClasses = headerStyle === "gradient"
      ? `${headerStyles.gradient} text-white p-6`
      : headerStyle === "technical"
        ? `${headerStyles.technical} p-6`
        : `${headerStyles.clean} p-6`

    const headerGradient = headerStyle === "gradient"
      ? { background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }
      : headerStyle === "clean"
        ? { borderBottomColor: primaryColor }
        : {}

    // Clean/Professional header style (CDG format)
    if (headerStyle === "clean") {
      return (
        <div className={headerClasses} style={headerGradient}>
          {/* Title */}
          <h1 className="text-xl font-bold text-slate-900 mb-4">
            {product?.name && `${product.name} – `}Release Notes
          </h1>

          {/* Info Table */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {showVersion && (
              <>
                <span className="font-semibold text-slate-700">Version:</span>
                <span className="text-slate-600">{releaseNote.version}</span>
              </>
            )}
            {showDate && releaseNote.releaseDate && (
              <>
                <span className="font-semibold text-slate-700">Release Date:</span>
                <span className="text-slate-600">{new Date(releaseNote.releaseDate).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit"
                })}</span>
              </>
            )}
            {showClient && releaseNote.client && (
              <>
                <span className="font-semibold text-slate-700">Client:</span>
                <span className="text-slate-600">{releaseNote.client}</span>
              </>
            )}
            {showEnvironment && releaseNote.environment && (
              <>
                <span className="font-semibold text-slate-700">Environment:</span>
                <span className="text-slate-600">{releaseNote.environment}</span>
              </>
            )}
            {showProductName && product?.name && (
              <>
                <span className="font-semibold text-slate-700">Product:</span>
                <span className="text-slate-600">{product.name}</span>
              </>
            )}
          </div>
        </div>
      )
    }

    // Gradient or Technical header style
    return (
      <div className={headerClasses} style={headerGradient}>
        {showProductName && product?.name && (
          <div className={`flex items-center gap-2 text-sm mb-2 opacity-90`}>
            <Package className="h-4 w-4" />
            <span>{product.name}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold">
          {showVersion && `v${releaseNote.version}`}
          {releaseNote.title && ` - ${releaseNote.title}`}
        </h1>
        {showDate && releaseNote.releaseDate && (
          <div className="flex items-center gap-2 text-sm mt-2 opacity-90">
            <Calendar className="h-4 w-4" />
            <span>{new Date(releaseNote.releaseDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</span>
          </div>
        )}
      </div>
    )
  }

  // Render a section
  // Note: Using fixed colors since this is a PDF preview with white background
  const renderSection = (section) => {
    const { key, label, itemTypes = [], showDescriptions = true } = section

    // Special handling for summary section
    if (key === "summary") {
      if (!releaseNote.summary) return null
      return (
        <div key={key} className="mb-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
            {label}
          </h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{releaseNote.summary}</p>
        </div>
      )
    }

    // Get items for this section
    const sectionItems = itemTypes.flatMap(type => itemsByType[type] || [])
    if (sectionItems.length === 0) return null

    const typeConfig = itemTypeConfig[itemTypes[0]] || itemTypeConfig.feature
    const TypeIcon = typeConfig.icon

    // Use numbered list for features ("What's New" section)
    const useNumberedList = key === "features" || label.toLowerCase().includes("what's new")

    return (
      <div key={key} className="mb-6">
        <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
          {showItemIcons && <TypeIcon className="h-5 w-5 inline mr-2" />}
          {label}
        </h2>
        {useNumberedList ? (
          <ol className="space-y-4 list-none">
            {sectionItems.map((item, index) => (
              <li key={item.id || index}>
                <div className="font-semibold text-slate-900 mb-1">
                  {index + 1}. {item.title}
                </div>
                {showDescriptions && item.description && (
                  <p className="text-sm text-slate-600 ml-4 whitespace-pre-line">{item.description}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-2">
            {sectionItems.map((item, index) => (
              <li key={item.id || index} className="flex items-start gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
                <div>
                  <span className="font-medium text-slate-900">{item.title}</span>
                  {showDescriptions && item.description && (
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
      style={{ fontFamily }}
    >
      {renderHeader()}
      <div className="p-6">
        {sections.map(section => renderSection(section))}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
          <div className="flex items-center justify-center gap-2">
            <Tag className="h-3 w-3" />
            <span>Generated from {template.name} template</span>
          </div>
        </div>
      </div>
    </div>
  )
})

ReleaseNotePreview.displayName = "ReleaseNotePreview"

export default ReleaseNotePreview
