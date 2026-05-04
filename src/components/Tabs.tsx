export type TabValue = "format" | "tree" | "transform" | "types" | "paths" | "history"

type TabItem = {
  value: TabValue
  label: string
}

const tabs: TabItem[] = [
  {
    value: "format",
    label: "Format",
  },
  {
    value: "tree",
    label: "Tree",
  },
  {
    value: "transform",
    label: "Transform",
  },
  {
    value: "types",
    label: "Types",
  },
  {
    value: "paths",
    label: "Paths",
  },
  {
    value: "history",
    label: "History",
  },
]

type TabsProps = {
  value: TabValue
  onChange: (value: TabValue) => void
}

export function Tabs({ value, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="JSON Toolbox sections">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={value === tab.value ? "tab-button tab-button-active" : "tab-button"}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
