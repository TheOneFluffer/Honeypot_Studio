document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cardsContainer');

    function createCard(game) {
        const card = document.createElement('div');
        card.classList.add('card');

        const image = document.createElement('img');
        image.src = game.image_url; // Replace 'image_url' with the actual column name for the image URL in your database
        image.alt = game.title;

        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');

        const title = document.createElement('h3');
        title.classList.add('card-title');
        title.textContent = game.title;

        const description = document.createElement('p');
        description.classList.add('card-description');
        description.textContent = game.description;

        const year = document.createElement('p');
        year.classList.add('card-year');
        year.textContent = `Year: ${game.year}`;

        cardContent.appendChild(title);
        cardContent.appendChild(description);
        cardContent.appendChild(year);

        card.appendChild(image);
        card.appendChild(cardContent);

        return card;
    }

    // Fetch data from the PHP script using Fetch API
    fetch('fetch_games.php')
        .then(response => response.json())
        .then(data => {
            // Populate the cards with the fetched data
            data.forEach(game => {
                const card = createCard(game);
                cardsContainer.appendChild(card);
            });
        })
        .catch(error => console.error('Error fetching data: ', error));
});