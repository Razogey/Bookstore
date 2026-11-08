(() => {
    "use strict";

    const STORAGE_KEY = "bookMarketDemoBooks";
    const initialBooks = [
        { title: "فن اللامبالاة", price: 5000 },
        { title: "قواعد العشق الأربعون", price: 6000 },
        { title: "الأب الغني والأب الفقير", price: 7000 }
    ];

    function setStatus(element, message, kind) {
        if (!element) return;
        element.textContent = message;
        element.classList.remove("is-success", "is-error");
        if (kind) element.classList.add(`is-${kind}`);
    }

    function readAddedBooks(statusElement) {
        try {
            const storedBooks = sessionStorage.getItem(STORAGE_KEY);
            if (!storedBooks) return [];
            const parsedBooks = JSON.parse(storedBooks);
            if (!Array.isArray(parsedBooks)) {
                throw new Error("قائمة الكتب ليست صالحة.");
            }
            return parsedBooks.filter(book =>
                book &&
                typeof book.title === "string" &&
                typeof book.price === "number" &&
                Number.isFinite(book.price)
            );
        } catch (error) {
            setStatus(statusElement, "تعذر تحميل قائمة الكتب.", "error");
            return [];
        }
    }

    function getBooks(statusElement) {
        return initialBooks.concat(readAddedBooks(statusElement));
    }

    function createBookCard(book) {
        const card = document.createElement("article");
        card.className = "book-card";

        const title = document.createElement("h3");
        title.textContent = book.title;

        const price = document.createElement("p");
        price.className = "book-price";
        price.textContent = `السعر: ${book.price} جنيه`;

        const action = document.createElement("a");
        action.className = "button button-primary";
        action.textContent = "طلب الكتاب";
        const requestUrl = new URL("request-book.html", window.location.href);
        requestUrl.searchParams.set("title", book.title);
        action.href = requestUrl.href;

        card.append(title, price, action);
        return card;
    }

    function renderBooks(container, books, statusElement) {
        if (!container) return;
        container.replaceChildren();

        if (books.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "muted";
            emptyMessage.textContent = "لا توجد كتب تطابق البحث. جرّب عبارة أخرى.";
            container.appendChild(emptyMessage);
            setStatus(statusElement, "لا توجد نتائج مطابقة للبحث.", "");
            return;
        }

        books.forEach(book => container.appendChild(createBookCard(book)));
        if (statusElement && !statusElement.classList.contains("is-error")) {
            setStatus(statusElement, `عدد الكتب المعروضة: ${books.length}`, "");
        }
    }

    function setupSearch() {
        const container = document.getElementById("booksList");
        if (!container) return;

        const searchInput = document.getElementById("searchInput");
        const searchForm = document.getElementById("bookSearchForm");
        const status = document.getElementById("booksStatus");
        const books = getBooks(status);
        const params = new URLSearchParams(window.location.search);
        const initialQuery = params.get("q") || "";

        if (searchInput) searchInput.value = initialQuery;

        const updateResults = () => {
            const query = searchInput ? searchInput.value.trim().toLocaleLowerCase() : "";
            const filteredBooks = books.filter(book =>
                book.title.toLocaleLowerCase().includes(query)
            );
            renderBooks(container, filteredBooks, status);
        };

        if (searchInput) searchInput.addEventListener("input", updateResults);
        if (searchForm) {
            searchForm.addEventListener("submit", event => {
                event.preventDefault();
                updateResults();
            });
        }
        updateResults();
    }

    function setupHomeSearch() {
        const form = document.getElementById("homeSearchForm");
        const input = document.getElementById("homeSearchInput");
        if (!form || !input) return;

        form.addEventListener("submit", event => {
            event.preventDefault();
            const target = new URL("books.html", window.location.href);
            target.searchParams.set("q", input.value.trim());
            window.location.href = target.href;
        });
    }

    function setupAddBookForm() {
        const form = document.getElementById("addBookForm");
        if (!form) return;

        const status = document.getElementById("addBookStatus");
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const title = document.getElementById("bookTitle").value.trim();
            const priceValue = document.getElementById("bookPrice").value;
            const price = Number(priceValue);

            if (!title || !Number.isFinite(price) || price <= 0) {
                setStatus(status, "أدخل اسم كتاب وسعراً أكبر من صفر.", "error");
                return;
            }

            const books = readAddedBooks(status);
            books.push({ title, price });
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(books));
                form.reset();
                setStatus(status, "تمت إضافة الكتاب إلى القائمة.", "success");
            } catch (error) {
                setStatus(status, "تعذر إضافة الكتاب إلى القائمة. يرجى المحاولة مرة أخرى.", "error");
            }
        });
    }

    function setupRequestForm() {
        const form = document.getElementById("requestBookForm");
        if (!form) return;

        const bookTitle = document.getElementById("requestedBookTitle");
        const status = document.getElementById("requestStatus");
        const requestedTitle = new URLSearchParams(window.location.search).get("title");
        if (requestedTitle) bookTitle.value = requestedTitle;

        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const fullName = document.getElementById("fullName").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const city = document.getElementById("city").value.trim();
            const phoneDigits = phone.replace(/\D/g, "");
            if (
                fullName.length < 3 ||
                !/^\+?[0-9()\-\s]+$/.test(phone) ||
                phoneDigits.length < 7 ||
                phoneDigits.length > 15 ||
                !city
            ) {
                setStatus(status, "تحقق من الاسم ورقم الهاتف والمدينة، ثم أعد المحاولة.", "error");
                return;
            }

            setStatus(status, "شكرًا لاهتمامك بطلب الكتاب.", "success");
            form.reset();
            bookTitle.value = requestedTitle || "";
        });
    }

    function setupContactForm() {
        const form = document.getElementById("contactForm");
        if (!form) return;

        const status = document.getElementById("contactStatus");
        const requiredFields = [
            document.getElementById("contactName"),
            document.getElementById("contactEmail"),
            document.getElementById("contactSubject"),
            document.getElementById("contactMessage")
        ];
        const phone = document.getElementById("contactPhone");

        form.addEventListener("submit", event => {
            event.preventDefault();
            requiredFields.forEach(field => {
                field.value = field.value.trim();
            });
            phone.value = phone.value.trim();

            const missingField = requiredFields.find(field => !field.value);
            if (missingField) {
                setStatus(status, "يرجى تعبئة جميع الحقول المطلوبة.", "error");
                missingField.focus();
                return;
            }

            const invalidField = requiredFields.find(field => !field.checkValidity());
            if (invalidField) {
                setStatus(
                    status,
                    invalidField === document.getElementById("contactEmail")
                        ? "يرجى إدخال بريد إلكتروني صحيح."
                        : "يرجى التأكد من صحة البيانات المدخلة.",
                    "error"
                );
                invalidField.focus();
                return;
            }

            const phoneDigits = phone.value.replace(/\D/g, "");
            if (
                phone.value &&
                (!/^\+?[0-9()\-\s]+$/.test(phone.value) ||
                    phoneDigits.length < 7 ||
                    phoneDigits.length > 15)
            ) {
                setStatus(status, "يرجى إدخال رقم هاتف صحيح أو ترك الحقل فارغاً.", "error");
                phone.focus();
                return;
            }

            setStatus(status, "تم استلام رسالتك بنجاح، شكراً لتواصلك معنا.", "success");
            form.reset();
        });
    }

    function setupHomeFeaturedBooks() {
        const container = document.getElementById("featuredBooks");
        if (!container) return;

        const books = getBooks(document.getElementById("featuredBooksStatus")).slice(0, 3);
        renderBooks(container, books, document.getElementById("featuredBooksStatus"));
    }

    document.addEventListener("DOMContentLoaded", () => {
        setupSearch();
        setupHomeSearch();
        setupAddBookForm();
        setupRequestForm();
        setupContactForm();
        setupHomeFeaturedBooks();
    });
})();
