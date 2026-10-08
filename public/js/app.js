const addTravelerGenderField = (traveler, index) => {
    if (!traveler || traveler.querySelector('[data-traveler-gender]')) return;

    const field = document.createElement('div');
    field.className = 'col-md-6';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = `traveler-gender-${index}`;
    label.textContent = 'Gender';
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = label.htmlFor;
    select.name = `travelers[${index}][gender]`;
    select.dataset.travelerGender = '';
    for (const [value, text] of [['', 'Prefer not to say'], ['Female', 'Female'], ['Male', 'Male'], ['Non-binary', 'Non-binary']]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.append(option);
    }
    field.append(label, select);
    traveler.querySelector('.row.g-3')?.append(field);
};

const reindexTravelers = (list) => {
    list.querySelectorAll('[data-traveler]').forEach((traveler, index) => {
        traveler.querySelectorAll('[name]').forEach((field) => {
            field.name = field.name.replace(/travelers\[\d+\]/, `travelers[${index}]`);
        });
        const title = traveler.querySelector('[data-traveler-title]');
        if (title) title.textContent = `Traveler ${index + 1}`;
        const gender = traveler.querySelector('[data-traveler-gender]');
        if (gender) gender.id = `traveler-gender-${index}`;
        const label = traveler.querySelector('label[for^="traveler-gender-"]');
        if (label) label.htmlFor = `traveler-gender-${index}`;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-traveler-list]').forEach((list) => {
        list.querySelectorAll('[data-traveler]').forEach((traveler, index) => addTravelerGenderField(traveler, index));
    });
});

document.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-traveler]');
    if (addButton) {
        const list = document.querySelector('[data-traveler-list]');
        const template = document.querySelector('#traveler-template');
        if (list && template && list.children.length < Math.min(30, Number(addButton.dataset.max || 30))) {
            const clone = template.content.cloneNode(true);
            clone.querySelectorAll('[data-field]').forEach((field) => {
                field.name = field.name.replace('__INDEX__', String(list.children.length));
            });
            addTravelerGenderField(clone.querySelector('[data-traveler]'), list.children.length);
            list.append(clone);
            reindexTravelers(list);
        }
    }

    const removeButton = event.target.closest('[data-remove-traveler]');
    if (removeButton) {
        const traveler = removeButton.closest('[data-traveler]');
        const list = traveler?.parentElement;
        traveler?.remove();
        if (list) reindexTravelers(list);
    }
});

document.addEventListener('input', (event) => {
    if (!event.target.matches('[data-payment-amount]')) return;
    const amount = Number(event.target.value || 0);
    const display = document.querySelector('[data-payment-preview]');
    if (display) display.textContent = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
});