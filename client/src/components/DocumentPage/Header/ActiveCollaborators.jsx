export default function ActiveCollaborators({ profiles }) {
  return (
    <div className="collaborators">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="collaborator"
          data-email={profile.email || "Unknown"}
        >
          {profile.image ? (
            <img src={profile.image} alt={profile.email || "Collaborator"} />
          ) : (
            <div className="no-avatar">
              {profile.email ? profile.email.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
