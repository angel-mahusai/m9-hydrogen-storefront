import React, {useState} from 'react';

interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  title?: string;
  tabContainerClassName?: string;
  tabHeaderClassName?: string;
  tabLinksClassName?: string;
  tabButtonClassName?: string;
}

export default function Tabs({
  tabs,
  title,
  tabContainerClassName = 'tabs-wrapper',
  tabHeaderClassName = '',
  tabLinksClassName = 'tabs-links',
  tabButtonClassName = 'tabs-button',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={tabContainerClassName}>
      {title && <h1 className={tabHeaderClassName}>{title}</h1>}
      <div className={tabLinksClassName}>
        {tabs.map((tab, index) => (
          <button
            className={`hover-underline-link ${tabButtonClassName}${index === activeTab ? ' active' : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="tabs-container ">
        <div className="tab-content">
          {/* {tabs.map((tab, index) => (
            <div key={tab.id}>{tab.content}</div>
          ))} */}
          <div key={tabs[activeTab].id}>{tabs[activeTab].content}</div>
        </div>
      </div>
    </div>
  );
}
