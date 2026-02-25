interface Props {
    checked: boolean;
    onChange: () => void;
}

export default function Toggle({ checked, onChange }: Props) {
    return (
        <label className="toggle">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="toggle-track" />
        </label>
    );
}
