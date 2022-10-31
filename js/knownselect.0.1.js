
var KnownSelect;
KnownSelect = function (Selector, OptionsToShow) {

	var _ = this;

	_.OptionsToShow = typeof (OptionsToShow) === 'undefined' ? 5 : OptionsToShow;

	_.InputValue = function (Input) {
		var Value = '';
		if (Input.nodeName.toLowerCase() === 'select') {
			if (typeof (Input.selectedOptions) === 'undefined') {
				var Options, i;
				Options = Input.children;
				i = Options.length;
				while (!!i) {
					i -= 1;
					if (Options[i].selected) {
						Value = Options[i].selected;
						i = 0;
					}
				}
			} else {
				if (Input.selectedOptions.length) {
					Value = Input.selectedOptions[0].value;
				}
			}
		} else {
			Value = Input.value;
		}
		return Value;
	};

	_.SelectJSON = function (Select) {
		var Result, Options, i, ii, Also;
		Result = [];
		Options = Select.querySelectorAll('option');
		i = 0;
		ii = Options.length;
		while (i < ii) {
			if (!Options[i].disabled) {
				if (!!Options[i].value.length) {
					Also = [];
					if (!!Options[i].getAttribute('data-synonyms')) {
						Also = Options[i].getAttribute('data-synonyms').split(',');
					}
					Result.push({
						"Text": Options[i].textContent,
						"Value": Options[i].value,
						"Also": Also
					});
				}
			}
			i += 1;
		}
		return Result;
	};

	_.Each = function (Arr, CallBack) {
		var i = Arr.length;
		while (!!i) {
			i -= 1;
			CallBack(Arr[i]);
		}
	};

	_.Search = function (Arr, Term) {
		var Results, Result, Relevance, RE;
		Results = [];

		_.Each(Arr, function (Option) {

			Relevance = 0;

			RE = new RegExp('^' + Term + '$', 'gi');
			if (RE.test(Option.Value)) {
				Relevance += 1000;
			}
			if (RE.test(Option.Text)) {
				Relevance += 500;
			}
			_.Each(Option.Also, function (Syn) {
				if (RE.test(Syn)) {
					Relevance += 50;
				}
			});

			RE = new RegExp('^' + Term, 'gi');
			if (RE.test(Option.Text)) {
				Relevance += 250;
			}
			_.Each(Option.Also, function (Syn) {
				if (RE.test(Syn)) {
					Relevance += 25;
				}
			});

			RE = new RegExp('(^|\\s)' + Term + '($|\\s)', 'gi');
			if (RE.test(Option.Text)) {
				Relevance += 100;
			}
			_.Each(Option.Also, function (Syn) {
				if (RE.test(Syn)) {
					Relevance += 10;
				}
			});

			RE = new RegExp('.*' + Term + '.*', 'gi');
			if (RE.test(Option.Text)) {
				Relevance += 60;
			}
			_.Each(Option.Also, function (Syn) {
				if (RE.test(Syn)) {
					Relevance += 1;
				}
			});

			if (!!Relevance) {
				Result = Option;
				Result.Relevance = Relevance;
				Results.push(Result);
			}

		});
		return Results.sort(function (a, b) {
			if (b.Relevance > a.Relevance) {
				return 1;
			}
			if (b.Relevance < a.Relevance) {
				return -1;
			}
			if (a.Text > b.Text) {
				return 1;
			}
			if (a.Text < b.Text) {
				return -1;
			}
			return 0;
		});
	};

	_.SetupAutocomplete = function (Select) {

		var __ = this;

		__.Select = Select;

		__.Values = _.SelectJSON(__.Select);

		__.InitValue = _.InputValue(__.Select);

		__.TextInput = null;
		__.HiddenInput = null;
		__.AutoCompleteHolder = null;

		__.Cheerio = function () {
			__.AutoCompleteHolder.className = 'select-autocomplete hidden';
		};

		__.OptionChosen = function (event) {
			var Button, Value;
			Button = event.target;
			Value = Button.getAttribute('data-value');
			__.HiddenInput.value = Value;
			__.TextInput.value = Button.textContent;
			__.Cheerio();
		};

		__.AddAutoCompleteOption = function (Text, Value) {

			var Option;
			Option = document.createElement('button');
			Option.type = 'button';
			Option.innerHTML = Text;
			Option.setAttribute('data-value', Value);
			Option.addEventListener('click', __.OptionChosen);
			Option.addEventListener('tap', __.OptionChosen);
			__.AutoCompleteHolder.appendChild(Option);
		};

		__.TextChanged = function () {

			if (!!_.InputValue(__.TextInput).length) {

				var Results, i, ii;
				Results = _.Search(__.Values, _.InputValue(__.TextInput));

				if (!!Results.length) {

					while (!!__.AutoCompleteHolder.childNodes.length) {
						__.AutoCompleteHolder.removeChild(__.AutoCompleteHolder.childNodes[0]);
					}

					if (Results.length === 1) {
						__.HiddenInput.value = Results[0].Value;
					}
					i = 0;
					ii = _.OptionsToShow;
					ii = Math.min(ii, Results.length);
					while (i < ii) {
						__.AddAutoCompleteOption(Results[i].Text, Results[i].Value);
						i += 1;
					}
				}
				__.AutoCompleteHolder.className = 'select-autocomplete';

			} else {
				__.Cheerio();
			}
		};

		__.ReplaceSelect = function () {

			__.HiddenInput = document.createElement('input');
			__.HiddenInput.name = __.Select.name;
			__.HiddenInput.id = __.Select.id + '_Hidden';
			__.HiddenInput.value = __.InitValue;
			__.HiddenInput.type = 'hidden';

			__.TextInput = document.createElement('input');
			__.TextInput.name = __.Select.name + '_Text';
			__.TextInput.id = __.Select.id;
			if (!!__.InitValue.length) {
				__.TextInput.value = __.Select.querySelector('option[value="' + __.InitValue + '"]').textContent;
			}
			__.TextInput.type = 'text';

			__.TextInput.addEventListener('keyup', __.TextChanged);

			__.AutoCompleteHolder = document.createElement('span');
			__.AutoCompleteHolder.className = 'select-autocomplete hidden';

			__.Select.parentNode.replaceChild(__.TextInput, __.Select);
			__.TextInput.parentNode.insertBefore(__.HiddenInput, __.TextInput.nextSibling);
			__.HiddenInput.parentNode.insertBefore(__.AutoCompleteHolder, __.HiddenInput.nextSibling);

		};

		__.ReplaceSelect();

	};

	_.Init = function () {

		var Inputs = document.querySelectorAll(Selector);
		var i = Inputs.length;

		while (!!i) {
			i -= 1;
			_.SetupAutocomplete(Inputs[i]);
		}

	};

	_.Init();

};