import React, { useState } from "react";
import { useStateValue } from '../state.js';
import { splitPath, kindName } from "../utils.js";
import { ObjAvail } from "./ObjAvail.jsx";
import { ObjActions } from "./ObjActions.jsx";
import { ObjState } from "./ObjState.jsx";
import { ObjInstanceCounts } from "./ObjInstanceCounts.jsx";
import { TableToolbar } from "./TableToolbar.jsx";

import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles, lighten } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Hidden from '@material-ui/core/Hidden';
import Toolbar from '@material-ui/core/Toolbar';

import FilterListIcon from '@material-ui/icons/FilterList';


const useStyles = makeStyles(theme => ({
	root: {
		padding: theme.spacing(3, 2),
		marginTop: theme.spacing(3),
		overflowX: 'auto',
	},
	tools: {
		alignItems: "flex-end",
	},
}))

function ObjsKindFilter(props) {
	const [{ kinds }, dispatch] = useStateValue();
	function handleChange(e) {
		dispatch({"type": "setKindFilter", "data": e.target.value})
	}
	return (
		<FormGroup row>
			<FormControl>
				<InputLabel htmlFor="select-multiple-checkbox">Kinds</InputLabel>
				<Select
					multiple
					value={kinds}
					onChange={handleChange}
					input={<Input id="select-multiple-checkbox" />}
					renderValue={selected => selected.join(', ')}
				>
				{["svc", "vol", "cfg", "sec", "usr", "ccfg"].map(kind => (
					<MenuItem key={kind} value={kind}>
						<Checkbox checked={kinds.indexOf(kind) > -1} />
						<ListItemText primary={kind} />
					</MenuItem>
				))}
				</Select>
			</FormControl>
		</FormGroup>
	)
}

function ObjsFilter(props) {
	const [{ filters }, dispatch] = useStateValue()
	function handleChange(e) {
		var t = e.target.getAtTableRowibute("t")
		dispatch({"type": "setFilter", "filter_type": t, "filter_value": e.target.value})
	}
	function handleTypeChange(e) {
		var t = e.target.value
		var currentType = Object.keys(filters)[0]
		var v = filters[currentType]
		dispatch({"type": "setFilter", "filter_type": t, "filter_value": v})
	}
	function handleChange(e) {
		var t = Object.keys(filters)[0]
		var v = e.target.value
		dispatch({"type": "setFilter", "filter_type": t, "filter_value": v})
	}
	var currentType = Object.keys(filters)[0]
	return (
		<FormGroup row>
			<FormControl>
				<InputLabel htmlFor="obj-search-type">Search In</InputLabel>
				<Select
					value={currentType}
					onChange={handleTypeChange}
					inputProps={{
						name: 'obj-search-type',
						id: 'obj-search-type',
					}}
				>
					<MenuItem value="name">Name</MenuItem>
					<MenuItem value="namespace">Namespace</MenuItem>
					<MenuItem value="path">Path</MenuItem>
				</Select>
			</FormControl>
			<FormControl>
				<TextField
					id="obj-search"
					label="Regular Expression"
					value={filters[currentType]}
					onChange={handleChange}
					margin="none"
				/>
			</FormControl>
		</FormGroup>
	)
}

function getLines(props) {
	const [{ cstat, kinds, filters }, dispatch] = useStateValue();
	const { kind, withScalerSlaves } = props
	var lines = []
	if (cstat.monitor === undefined) {
		return lines
	}
	if (filters.name) {
		var reFilters = RegExp(filters.name, "i")
	} else {
		var reFilters = null
	}
	if (filters.namespace) {
		var reNamespace = RegExp(filters.namespace, "i")
	} else {
		var reNamespace = null
	}
	if (filters.path) {
		var rePath = RegExp(filters.path, "i")
	} else {
		var rePath = null
	}
	for (var path in cstat.monitor.services) {
		var sp = splitPath(path)

		// Apply filters
		if (kind) {
			if (sp.kind != kind) {
				continue
			}
		} else {
			if (kinds.indexOf(sp.kind) < 0) {
				continue
			}
		}
		try {
			if (reName && !rename.test(sp.name)) {
				continue
			}
		} catch (e) {}
		try {
			if (reNamespace && !reNamespace.test(sp.namespace)) {
				continue
			}
		} catch (e) {}
		try {
			if (rePath && !rePath.test(path)) {
				continue
			}
		} catch (e) {}

		if (!withScalerSlaves && sp.name.match(/[0-9]+\./)) {
			// discard scaler slaves
			continue
		}
		lines.push(path)
	}
	return lines
}

function Objs(props) {
	const classes = useStyles()
	const [{ cstat }, dispatch] = useStateValue();
	const [selected, setSelected] = React.useState([]);
	const lines = getLines({kind: props.kind})

	if (cstat.monitor === undefined) {
		return lines
	}

	function handleSelectAllClick(event) {
		if (event.target.checked) {
			const newSelecteds = lines
			setSelected(newSelecteds)
			return;
		}
		setSelected([]);
	}

	function handleTitleClick(e) {
		dispatch({
			type: "setNav",
			page: "Objects",
			links: ["Objects"],
		})
	}

	var rowCount = lines.length
	var title = "Objects"
	if (props.kind == "svc") {
		title = "Services"
	} else if (props.kind == "vol") {
		title = "Volumes"
	} else if (props.kind == "cfg") {
		title = "Configs"
	} else if (props.kind == "sec") {
		title = "Secrets"
	} else if (props.kind == "usr") {
		title = "Users"
	}

	return (
		<Paper id="objects" className={classes.root}>
			<Typography variant="h4" component="h3">
				<Link href="#" onClick={handleTitleClick}>{title}</Link>
			</Typography>
			<Grid container className={classes.tools} spacing={1}>
				{!props.kind &&
				<Grid item>
					<ObjsKindFilter />
				</Grid>
				}
				<Grid item>
					<ObjsFilter />
				</Grid>
			</Grid>
			<TableToolbar selected={selected}>
				{selected.length > 0 ? (
					<ObjActions selected={selected} title="" />
				) : (
					<Tooltip title="Filter list">
						<IconButton aria-label="Filter list">
							<FilterListIcon />
						</IconButton>
					</Tooltip>
				)}
			</TableToolbar>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell padding="checkbox">
							<Checkbox
								indeterminate={selected.length > 0 && selected.length < rowCount}
								checked={selected.length === rowCount}
								onChange={handleSelectAllClick}
								inputProps={{ 'aria-label': 'Select all' }}
							/>
						</TableCell>
						<Hidden mdUp>
							<TableCell>Path</TableCell>
						</Hidden>
						<Hidden smDown>
							<TableCell>Namespace</TableCell>
							<TableCell>Kind</TableCell>
							<TableCell>Name</TableCell>
						</Hidden>
						<Hidden smUp>
							<TableCell>State</TableCell>
						</Hidden>
						<Hidden xsDown>
							<TableCell>Availability</TableCell>
							<TableCell>State</TableCell>
						</Hidden>
						<TableCell>Instances</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{lines.sort().map((path, i) => (
						<ObjLine key={path} index={i} path={path} selected={selected} setSelected={setSelected} title={title} />
					))}
				</TableBody>
			</Table>
		</Paper>
	)
}

function ObjLine(props) {
	const {index, path, selected, setSelected, withScalerSlaves, title } = props
	const [{ cstat, kinds, filters }, dispatch] = useStateValue();
	const sp = splitPath(path)
	function handleClick(event) {
		event.stopPropagation()
		const selectedIndex = selected.indexOf(path)
		let newSelected = []

		if (selectedIndex === -1) {
			newSelected = newSelected.concat(selected, path);
		} else if (selectedIndex === 0) {
			newSelected = newSelected.concat(selected.slice(1));
		} else if (selectedIndex === selected.length - 1) {
			newSelected = newSelected.concat(selected.slice(0, -1));
		} else if (selectedIndex > 0) {
			newSelected = newSelected.concat(
				selected.slice(0, selectedIndex),
				selected.slice(selectedIndex + 1),
			);
		}
		setSelected(newSelected);
	}

	function handleLineClick(e) {
		dispatch({
			type: "setNav",
			page: title,
			links: [title, path]
		})
	}
	const isItemSelected = selected.indexOf(path) !== -1
	const labelId = `objs-checkbox-${index}`

	return (
		<TableRow
			onClick={handleLineClick}
			hover
			role="checkbox"
			aria-checked={isItemSelected}
			tabIndex={-1}
			key={path}
			selected={isItemSelected}
		>
			<TableCell padding="checkbox" onClick={handleClick}>
				<Checkbox
					checked={isItemSelected}
					inputProps={{ 'aria-labelledby': labelId }}
				/>
			</TableCell>

			<Hidden mdUp>
				<TableCell>{path}</TableCell>
			</Hidden>
			<Hidden smDown>
				<TableCell>{sp.namespace}</TableCell>
				<TableCell>{sp.kind}</TableCell>
				<TableCell>{sp.name}</TableCell>
			</Hidden>
			<Hidden smUp>
				<TableCell>
					<ObjState path={path} />
				</TableCell>
			</Hidden>
			<Hidden xsDown>
				<TableCell><ObjAvail avail={cstat.monitor.services[path].avail} /></TableCell>
				<TableCell><ObjState path={path} /></TableCell>
			</Hidden>
			<TableCell><ObjInstanceCounts path={path} /></TableCell>
		</TableRow>
	)
}

export {
	Objs
}
