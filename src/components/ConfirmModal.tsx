interface Props {
    title: string;
    body: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    title, body, confirmLabel, cancelLabel, onConfirm, onCancel,
}: Props) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                <p>{body}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
