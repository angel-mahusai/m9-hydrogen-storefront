import {i} from 'node_modules/react-router/dist/development/lib-CCSAGgcP.mjs';

interface AnnouncementBarProps {
  announcements: string[];
}

export function AnnouncementBar({announcements}: AnnouncementBarProps) {
  let announcementsToDisplay: string[] = [];
  if (!announcements.length) return null;
  announcementsToDisplay = announcements.concat(announcements);
  if (announcements.length === 1) {
    announcementsToDisplay = announcementsToDisplay.concat(
      announcementsToDisplay,
    );
  }
  return (
    <div className="announcement-bar">
      <div className="announcement-items-container">
        <div className="announcement-bar__ticker">
          {announcementsToDisplay.map((item, index) => (
            <div className="announcement-item" key={`announcement-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
